module.exports = [require('./voice-assistant')].reduce((map, subscriber) => {
  if (typeof subscriber.handler !== 'function') {
    return map;
  }

  for (let pattern of subscriber.patterns.values()) {
    if (map.has(pattern)) {
      map.get(pattern).add(subscriber.handler);
    } else {
      map.set(pattern, new Set([subscriber.handler]));
    }
  }

  return map;
}, new Map());
