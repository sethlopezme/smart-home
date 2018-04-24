module.exports = class Slot {
  constructor(
    {
      entity,
      slotName: name,
      rawValue,
      range: { start, end },
      value: { kind, ...value },
    },
    checkEntity
  ) {
    if (!entity) {
      throw new Error('entity is required');
    } else if (typeof entity !== 'string') {
      throw new Error('entity must be a string');
    }

    if (checkEntity && checkEntity !== entity) {
      throw new Error(`entity "${entity}" does not match "${checkEntity}"`);
    }

    if (!name) {
      throw new Error('name is required');
    } else if (typeof name !== 'string') {
      throw new Error('name must be a string');
    }

    if (!rawValue) {
      throw new Error('rawValue is required');
    } else if (typeof rawValue !== 'string') {
      throw new Error('rawValue must be a string');
    }

    if (!start) {
      throw new Error('range.start is required');
    } else if (typeof start !== 'number' || start < 0 || start === Infinity) {
      throw new Error('range.start must be an integer greater than zero');
    }

    if (!end) {
      throw new Error('range.end is required');
    } else if (typeof end !== 'number' || end < start || end === Infinity) {
      throw new Error('range.end must be an integer greater than start');
    }

    if (!kind) {
      throw new Error('value.kind is required');
    } else if (typeof kind !== 'string') {
      throw new Error('value.kind must be a string');
    }

    this.entity = entity;
    this.name = name;
    this.rawValue = rawValue;
    this.start = parseInt(start, 10);
    this.end = parseInt(end, 10);
    this.kind = kind;
    this.value = value;
  }

  isCustom() {
    return this.kind === 'Custom';
  }
};
