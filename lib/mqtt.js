'use strict';

let mqtt = require('mqtt');

let path = require('path');
let log = require('./log');
let config = require('./config');
let mqttConfig = require(path.join(`${config.dataDir}/config.json`));

let client = mqtt.connect(mqttConfig.broker);

client.on('connect', function () {
  client.subscribe('devices/#', { qos: 2 });
  log.info('connected to MQTT');
});

client.on('error', function (err) {
  log.error(err);
});

module.exports = client;
