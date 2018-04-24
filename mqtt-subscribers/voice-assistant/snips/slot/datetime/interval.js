const Moment = require('moment');
const SnipsDateTimeSlot = require('./index');

module.exports = class SnipsDateTimeIntervalSlot extends SnipsDateTimeSlot {
  constructor(slot) {
    super(slot);
    this.from = Moment(slot.value.from, SnipsDateTimeSlot.format);
    this.to = Moment(slot.value.to, SnipsDateTimeSlot.format);
  }

  intersects(from, to, precision) {
    return (
      this.from.isSameOrBefore(to, precision) &&
      this.to.isSameOrAfter(from, precision)
    );
  }
};
