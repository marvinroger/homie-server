'use strict';

let bunyan = require('bunyan');
let log = bunyan.createLogger({ name: 'homie', level: 'debug' });

module.exports = log;
