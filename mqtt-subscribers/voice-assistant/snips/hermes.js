const Moment = require('moment');

module.exports = class Hermes {
  static async _publish(mqtt, topic, message, options = {}) {
    options = {
      qos: 0,
      retain: false,
      dup: false,
      ...options,
    };
    return mqtt.publish(topic, JSON.stringify(message), options);
  }

  static async startSession(mqtt, siteId, init, data = null) {
    return Hermes._publish(mqtt, 'hermes/dialogueManager/startSession', {
      siteId,
      init,
      customData: data ? JSON.stringify(data) : null,
    });
  }

  static async continueSession(mqtt, sessionId, text, intents = null) {
    return Hermes._publish(mqtt, 'hermes/dialogueManager/continueSession', {
      sessionId,
      text,
      intentFilter: intents,
    });
  }

  static async endSession(mqtt, sessionId, text = null) {
    return Hermes._publish(mqtt, 'hermes/dialogueManager/endSession', {
      sessionId,
      text,
    });
  }

  static async say(mqtt, siteId, text) {
    return Hermes._publish(mqtt, 'hermes/tts/say', { siteId, text });
  }
};
