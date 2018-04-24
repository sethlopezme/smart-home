module.exports = [require('./weather')].reduce((map, bundle) => {
  for (let intentName of bundle.intentNames.values()) {
    map.set(intentName, bundle.handler);
  }

  return map;
}, new Map());
