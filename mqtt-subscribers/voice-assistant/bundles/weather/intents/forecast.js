const Moment = require('moment');

const Snips = require('../../../snips');
const SnipsDateTimeInstantSlot = require('../../../snips/slot/datetime/instant');
const SnipsDateTimeIntervalSlot = require('../../../snips/slot/datetime/interval');

module.exports = {
  intentNames: new Set(['searchWeatherForecast']),
  async handler(ctx) {
    const {
      customData: {
        criteria: { forecast_start_datetime: timeSlot },
        forecast,
        location,
      },
      logger,
      mqtt,
      payload: { sessionId },
    } = ctx;

    let reply;

    if (
      !timeSlot ||
      (timeSlot instanceof SnipsDateTimeInstantSlot &&
        timeSlot.isGrainEqualTo('week') &&
        forecast.daily &&
        forecast.daily.data.length > 1)
    ) {
      reply = forecast.daily.data
        .slice(1)
        .map(makeDailyReplyDataFormatter('dddd'))
        .map(makeDailyReply)
        .join(' ');
    } else if (timeSlot && timeSlot instanceof SnipsDateTimeInstantSlot) {
      // TODO
    } else if (timeSlot && timeSlot instanceof SnipsDateTimeIntervalSlot) {
      // TODO
    }

    if (!reply) {
      return Snips.reply(
        mqtt,
        sessionId,
        "Sorry. I couldn't find enough forecast data for that."
      );
    }

    return Snips.reply(mqtt, sessionId, reply);
  },
};

function makeDailyReplyDataFormatter(dateFormat) {
  return day => {
    return {
      time: Moment.unix(day.time).format(dateFormat),
      summary: day.summary.toLowerCase().replace(/\./g, ''),
      high: Math.round(day.temperatureHigh),
      low: Math.round(day.temperatureLow),
      precipChance: day.precipProbability > 0.1 ? day.precipProbability : 0,
      precipType: day.precipType,
      cloudCover: day.cloudCover,
    };
  };
}

function makeDailyReply(day) {
  const {
    time,
    summary,
    high,
    low,
    precipChance,
    precipType,
    cloudCover,
  } = day;
  return `${time}, ${summary} with a high of ${high} and a low of ${low}.`;
}

function formatCurrent(current) {}

function makeReply(speechData) {}
