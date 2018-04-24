const Moment = require('moment');
const SnipsDateTimeSlot = require('./index');

const grains = [
  'year',
  'quarter',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
];

module.exports = class SnipsDateTimeInstantSlot extends SnipsDateTimeSlot {
  constructor(slot) {
    super(slot);

    this.instant = Moment(slot.value.value, SnipsDateTimeSlot.format);
    this.grain = grains.indexOf(slot.value.grain.toLowerCase());
    this.precision = slot.value.precision;
  }

  static _getGrainIndex(grain) {
    const index = grains.indexOf(grain.toLowerCase());

    if (index === -1) {
      throw new Error('invalid grain');
    }

    return index;
  }

  isGrainEqualTo(grain) {
    return this.grain === SnipsDateTimeInstantSlot._getGrainIndex(grain);
  }

  isGrainSmallerThan(grain) {
    return this.grain > SnipsDateTimeInstantSlot._getGrainIndex(grain);
  }

  isGrainSmallerThanOrEqualTo(grain) {
    return this.grain >= SnipsDateTimeInstantSlot._getGrainIndex(grain);
  }

  isGrainLargerThan(grain) {
    return this.grain < SnipsDateTimeInstantSlot._getGrainIndex(grain);
  }

  isGrainLargerThanOrEqualTo(grain) {
    return this.grain <= SnipsDateTimeInstantSlot._getGrainIndex(grain);
  }

  isApproximate() {
    return this.precision === 'Approximate';
  }

  isExact() {
    return this.precision === 'Exact';
  }
};
