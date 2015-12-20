'use strict';

const port = 1883;

import {EventEmitter} from 'events';
import aedes from 'aedes';

import log from './log';

class MqttBroker extends EventEmitter {
  constructor () {
    super();
    this.aedesInstance = aedes();
    this.server = require('net').createServer(this.aedesInstance.handle);

    this.aedesInstance.authorizePublish = function (client, packet, cb) {
      if (packet.topic.startsWith('devices/') && !packet.topic.startsWith(`devices/${client.id}/`)) {
        return cb(new Error(`client ${client.id} cannot publish to ${packet.topic}`));
      }

      cb(null);
    };

    this.aedesInstance.authorizeSubscribe = function (client, sub, cb) {
      if (sub.topic.startsWith('devices/') && !sub.topic.startsWith(`devices/${client.id}/`)) {
        return cb(new Error(`client ${client.id} cannot subscribe to ${sub.topic}`));
      }

      cb(null);
    };

    this.aedesInstance.on('publish', function (packet, client) {
      if (packet.topic.startsWith('devices/')) {
        this.emit('message', packet.topic, packet.payload.toString());
      }
    });

    this.server.listen(port, () => {
      let host = this.server.address().address;
      let port = this.server.address().port;
      log.info(`MQTT broker listening on ${host}:${port}`);
    }).on('error', function (err) {
      log.fatal(err);
    });
  }

  publish (packet) {
    this.aedesInstance.publish(packet);
  }
}

export default new MqttBroker();
