const Hermes = require('./hermes');
const Slot = require('./slot');

const snipsSlotClasses = [
  require('./slot/datetime/instant'),
  require('./slot/datetime/interval'),
];

/**
 *
 * @type {module.Snips}
 */
module.exports = class Snips {
  static async ask(mqtt, sessionId, text, intents = null) {
    return Hermes.continueSession(mqtt, sessionId, text, intents);
  }

  static async begin(
    mqtt,
    siteId,
    text = null,
    intents = null,
    data = null,
    canBeEnqueued = true
  ) {
    return Hermes.startSession(
      mqtt,
      siteId,
      { type: 'action', text, canBeEnqueued, intentFilter: intents },
      data
    );
  }

  static async notify(mqtt, siteId, text, data = null) {
    return Hermes.startSession(
      mqtt,
      siteId,
      { type: 'notification', text },
      data
    );
  }

  static async reply(mqtt, sessionId, text = null) {
    return Hermes.endSession(mqtt, sessionId, text);
  }

  static async say(mqtt, siteId, text) {
    return Hermes.say(mqtt, siteId, text);
  }

  static parseSlot(slot, classes = []) {
    if (slot instanceof Slot) {
      return slot;
    }

    classes = Array.isArray(classes)
      ? [...classes, ...snipsSlotClasses]
      : snipsSlotClasses;
    const Class = classes.find(
      Class => Class.entity && slot.entity && Class.entity === slot.entity
    );

    if (Class) {
      return new Class(slot);
    }

    return new Slot(slot);
  }
};
