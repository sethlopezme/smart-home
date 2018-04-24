const Slot = require('../index');

module.exports = class SnipsDateTimeSlot extends Slot {
  constructor(slot) {
    super(slot, SnipsDateTimeSlot.entity);
  }

  static get entity() {
    return 'snips/datetime';
  }

  static get format() {
    return 'YYYY-MM-DD HH:mm:ss ZZ';
  }
};
