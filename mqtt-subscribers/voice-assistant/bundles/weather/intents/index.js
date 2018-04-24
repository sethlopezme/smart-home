module.exports = [
  require('./condition'),
  require('./forecast'),
  require('./item'),
  require('./temperature'),
].reduce((map, intent) => {
  for (let intentName of intent.intentNames.values()) {
    map.set(intentName, intent.handler);
  }

  return map;
}, new Map());
