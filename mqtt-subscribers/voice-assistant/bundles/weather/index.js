const Axios = require('axios');
const DarkSky = require('dark-sky');
const GoogleMaps = require('@google/maps');
const Moment = require('moment');

const intents = require('./intents');
const Snips = require('../../snips');
const SnipsError = require('../../snips/error');
const SnipsDateTimeInstantSlot = require('../../snips/slot/datetime/instant');
const SnipsDateTimeIntervalSlot = require('../../snips/slot/datetime/interval');

class ApiError extends SnipsError {}
class TimeGrainError extends SnipsError {}
class TimeRangeError extends SnipsError {}
class LocationSpecificityError extends SnipsError {}
class LocationUnknownError extends SnipsError {}

module.exports = {
  intentNames: new Set(intents.keys()),
  async handler(ctx) {
    const {
      customData,
      logger,
      mqtt,
      params: { intentName },
      payload: { sessionId, slots },
    } = ctx;
    // transform slots into an object of criteria
    const criteria = slots
      .filter(slot => !slot.rawValue.includes('unknownword'))
      .reduce((object, slot) => {
        object[slot.name] = slot;
        return object;
      }, {});

    // figure out the time
    let time;
    try {
      time = getTime(criteria);
    } catch (error) {
      logger.error(error);
      return Snips.reply(
        mqtt,
        sessionId,
        'Sorry. I can only get the forecast for this week or a specific day.'
      );
    }

    // figure out the location
    let location;
    try {
      location = await getLocation(criteria);
    } catch (error) {
      logger.error(error);
      let reply;

      if (error instanceof ApiError) {
        reply = "Sorry. I couldn't look up that location.";
      } else if (error instanceof LocationSpecificityError) {
        reply = 'Sorry. I need a more specific location. Try including a city.';
      } else if (error instanceof LocationUnknownError) {
        reply = "Sorry. I don't know that location.";
      }

      return Snips.reply(mqtt, sessionId, reply);
    }

    // attempt to get the forecast
    let forecast;
    try {
      forecast = await getForecast(location, time);
    } catch (error) {
      logger.log(error);
      return Snips.reply(
        mqtt,
        sessionId,
        "Sorry. I cant't get the forecast right now."
      );
    }

    // assign the details and forecast to the session context
    Object.assign(customData, {
      criteria,
      location,
      forecast,
    });

    const handler = intents.get(intentName);

    // report that there isn't a handler for the intent id
    if (!handler) {
      logger.warn('no intent handler found for intentName "%s"', intentName);
      return Snips.reply(
        mqtt,
        sessionId,
        "Sorry. I don't know how to do that yet."
      );
    }

    return handler.call(null, ctx);
  },
};

function getTime(criteria) {
  const slot = criteria.forecast_start_datetime;

  if (!slot) {
    return null;
  }

  if (slot instanceof SnipsDateTimeInstantSlot) {
    return getForecastTimeForInstant(slot);
  } else if (slot instanceof SnipsDateTimeIntervalSlot) {
    return getForecastTimeForInterval(slot);
  }

  return null;
}

function getForecastTimeForInstant(slot) {
  const forecastStart = Moment().startOf('day');
  const forecastEnd = Moment()
    .add(7, 'days')
    .endOf('day');

  if (slot.isGrainLargerThan('week')) {
    // grain is a month+
    throw new TimeGrainError('time instant grain is too large');
  } else if (
    slot.isGrainEqualTo('week') &&
    !slot.instant.isSame(forecastStart, 'isoWeek')
  ) {
    // not this week
    throw new TimeRangeError('time instant is outside of the current ISO week');
  } else if (slot.isGrainSmallerThanOrEqualTo('day')) {
    // specific day
    return slot.instant.format('YYYY-MM-DD');
  }

  // within this forecast week
  return null;
}

function getForecastTimeForInterval(slot) {
  const forecastStart = Moment().startOf('day');
  const forecastEnd = Moment(forecastStart)
    .add(7, 'days')
    .endOf('day');

  if (!slot.intersects(forecastStart, forecastEnd)) {
    throw new TimeRangeError('time interval is outside forecast range');
  }

  return null;
}

async function getLocation(criteria) {
  if (
    (criteria.forecast_region || criteria.forecast_country) &&
    (!criteria.forecast_geographical_poi && !criteria.forecast_locality)
  ) {
    // not specific enough, only region or country given
    throw new LocationSpecificityError('only region or country supplied');
  } else if (
    !criteria.forecast_locality &&
    !criteria.forecast_geographical_poi
  ) {
    // no location given, look up IP
    return getLocationByIp();
  } else {
    // geocode address
    return getLocationByAddress(criteria);
  }
}

async function getLocationByIp() {
  try {
    const {
      data: { city: locality, latitude: lat, longitude: lng },
    } = await Axios.get('http://api.ipstack.com/check', {
      params: {
        access_key: process.env.IPSTACK_API_KEY,
      },
    });
    return {
      address: locality,
      lat,
      lng,
    };
  } catch (error) {
    throw new ApiError('IP geolocation request failure');
  }
}

async function getLocationByAddress(criteria) {
  let response;
  try {
    const address = [
      criteria.forecast_geographical_poi || criteria.forecast_locality,
      criteria.forecast_region,
      criteria.forecast_country,
    ]
      .filter(Boolean)
      .map(slot => slot.value.value)
      .join(', ');
    const client = GoogleMaps.createClient({
      key: process.env.GOOGLE_API_KEY,
      Promise,
    });
    response = await client.geocode({ address }).asPromise();
  } catch (error) {
    throw new ApiError('address geocode request failure');
  }

  const {
    json: { status, results },
  } = response;

  if (status === 'ZERO_RESULTS') {
    throw new LocationUnknownError('zero geocode results');
  } else if (status !== 'OK') {
    throw new ApiError(`geocode failure status: ${status}`);
  }

  const result = results.find(result => result.types.includes('locality'));

  if (!result) {
    throw new LocationUnknownError('no locality geocode result');
  }

  return {
    address: result.formatted_address,
    ...result.geometry.location,
  };
}

async function getForecast(location, time = null) {
  try {
    const client = new DarkSky(process.env.DARK_SKY_API_KEY);
    return await client
      .options({
        latitude: location.lat,
        longitude: location.lng,
        time,
      })
      .get();
  } catch (error) {
    throw new ApiError('forecast request failure');
  }
}
