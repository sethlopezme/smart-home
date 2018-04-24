const Snips = require('./snips');

module.exports = (key, value) => {
  if (key === 'slots' && Array.isArray(value)) {
    return value.map(Snips.parseSlot);
  } else if (key === 'customData') {
    try {
      return value ? JSON.parse(value) : {};
    } catch (error) {
      return {};
    }
  }

  return value;
};
