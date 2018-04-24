const ExtendableError = require('es6-error');

module.exports = class SnipsError extends ExtendableError {
  constructor(message, say = null) {
    super(message);
    this.say = say;
  }
};
