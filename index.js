require('dotenv').config();

const Fs = require('fs');
const Mqtt = require('async-mqtt');
const MqttPattern = require('mqtt-pattern');
const Path = require('path');
const pino = require('pino');

const logger = pino({
  name: 'smart-home',
  timestamp: pino.stdTimeFunctions.slowTime,
  level: process.env.LOG_LEVEL || 'info',
});

// attempt to load the ecosystem file
let ecosystem;
const ecosystemPath = Path.resolve(__dirname, 'ecosystem.json');
try {
  const json = Fs.readFileSync(ecosystemPath, { encoding: 'utf8' });
  ecosystem = JSON.parse(json);
} catch (error) {
  logger.error(error, 'unable to locate ecosystem file at %s', ecosystemPath);
  ecosystem = { groups: [], devices: [] };
}

const mqtt = Mqtt.connect(process.env.MQTT_URI);
const subscribers = require('./mqtt-subscribers');
const ctx = { ecosystem, logger, mqtt };

// set up MQTT subscriptions once connected
mqtt.once('connect', () => {
  logger.info('connected');
  const topicsSet = [...subscribers.keys()]
    .map(topic => MqttPattern.clean(topic))
    .reduce((set, topic) => set.add(topic), new Set());
  mqtt.subscribe([...topicsSet]);
});

// handle MQTT messages
mqtt.on('message', (topic, message) => {
  logger.info('message received for topic "%s"', topic);
  for (let [pattern, handlers] of subscribers.entries()) {
    const params = MqttPattern.exec(pattern, topic);
    if (params === null) {
      continue;
    }

    for (let handler of handlers) {
      handler
        .call(null, { ...ctx, topic, params, message })
        .catch(error =>
          logger.error(
            error,
            'error in MQTT message subscription handler for topic "%s"',
            topic
          )
        );
    }
  }
});
