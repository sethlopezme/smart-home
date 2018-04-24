const Snips = require('./snips');
const bundles = require('./bundles');
const reviver = require('./payload-reviver');

module.exports = {
  patterns: new Set(['hermes/intent/+intentName']),
  async handler(ctx) {
    const {
      mqtt,
      logger,
      params: { intentName },
    } = ctx;
    // parse the message buffer as JSON, process it, and put it in the context
    const { customData, ...payload } = JSON.parse(
      ctx.message.toString(),
      reviver
    );
    Object.assign(ctx, { customData, payload });

    // get the bundle handler for the intent name
    const handler = bundles.get(intentName);
    if (!handler) {
      logger.warn('no bundle handler found for intentName "%s"', intentName);
      return Snips.reply(
        mqtt,
        payload.sessionId,
        "I don't know how to do that yet."
      );
    }

    try {
      await handler.call(null, ctx);
    } catch (error) {
      logger.error(
        error,
        'error in bundle handler for intentName "%s"',
        intentName
      );
      await Snips.reply(
        mqtt,
        payload.sessionId,
        'Sorry. Something went wrong while I was figuring that out.'
      );
    }
  },
};
