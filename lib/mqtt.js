'use strict';

const port = 35589;

import path from 'path';
import {EventEmitter} from 'events';
import mosca from 'mosca';

import config from './config';
import log from './log';

class MqttBroker extends EventEmitter {
  constructor () {
    super();

    this.moscaInstance = new mosca.Server({
      port: port,
      persistence: {
        factory: mosca.persistence.LevelUp,
        path: path.join(config.dataDir, '/db/broker.db')
      }
    });

    this.moscaInstance.authorizePublish = function (client, topic, payload, cb) {
      if (topic.startsWith('devices/') && !topic.startsWith(`devices/${client.id}/`) && !topic.endsWith('/set')) {
        return cb(null, false);
      }

      cb(null, true);
    };

    this.moscaInstance.authorizeSubscribe = function (client, topic, cb) {
      if (topic.startsWith('devices/') && !topic.startsWith(`devices/${client.id}/`)) {
        return cb(null, false);
      }

      cb(null, true);
    };

    this.moscaInstance.on('published', (packet, client) => {
      if (packet.topic.startsWith('devices/')) {
        this.emit('message', packet.topic, packet.payload.toString());
      }
    });

    this.moscaInstance.on('ready', () => {
      log.info(`MQTT broker listening on :::${port}`);
    });
  }

  publish (packet) {
    this.moscaInstance.publish(packet, function () {});
  }
}

export default new MqttBroker();
