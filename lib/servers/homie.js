'use strict';

const PORT = 35589;

import path from 'path';
import mosca from 'mosca';
import pauseable from 'pauseable';

import dispatcher from '../dispatcher';
import Server from './server';
import parser from '../mqtt-parser';
import log from '../log';

class HomieServer extends Server {
  constructor (options) {
    super('Homie');

    this.dataDir = options.dataDir;
  }

  start () {
    this.moscaInstance = new mosca.Server({
      port: PORT,
      persistence: {
        factory: mosca.persistence.LevelUp,
        path: path.join(this.dataDir, '/db/broker.db')
      }
    });

    dispatcher.on('ready', () => {
      pauseable.resume(this.moscaInstance);
    });

    this.moscaInstance.on('clientConnected', (client) => {
      log.debug(`${client.id} connected to MQTT`);
    });

    this.moscaInstance.on('clientDisconnected', (client) => {
      log.debug(`${client.id} disconnected from MQTT`);
    });

    this.moscaInstance.authorizePublish = function (client, topic, payload, cb) {
      if (!parser.parse(topic, payload.toString())) { // if invalid homie message, reject it
        return cb(null, false);
      }

      cb(null, true);
    };

    this.moscaInstance.authorizeSubscribe = function (client, topic, cb) {
      // anyone can subscribe to anything
      cb(null, true);
    };

    this.moscaInstance.on('published', (packet, client) => {
      if (packet.topic.startsWith('$SYS')) {
        return;
      }

      this.emit('message', packet.topic, packet.payload.toString());
    });

    this.moscaInstance.on('ready', () => {
      this.emit('ready', { host: '', port: PORT });

      pauseable.pause(this.moscaInstance); // Buffer events until dispatcher is ready
    });
  }

  publish (packet) {
    this.moscaInstance.publish(packet, function () {});
  }
}

export default HomieServer;
