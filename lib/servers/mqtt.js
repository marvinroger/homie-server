'use strict';

const PORT = 35589;

import {createServer} from 'net';
import path from 'path';
import aedes from 'aedes';
import aedesPersistenceLevel from 'aedes-persistence-level';
import level from 'level';
import pauseable from 'pauseable';

import dispatcher from '../dispatcher';
import Server from './server';
import parser from '../mqtt-parser';
import log from '../log';

class MqttServer extends Server {
  constructor (options) {
    super('MQTT');

    this.dataDir = options.dataDir;
  }

  start () {
    this.mqtt = aedes({
      persistence: aedesPersistenceLevel(level(path.join(this.dataDir, '/db/broker.db')))
    });
    this.server = createServer(this.mqtt.handle);

    dispatcher.on('ready', () => {
      pauseable.resume(this.mqtt);
    });

    this.mqtt.on('client', (client) => {
      log.debug(`${client.id} connected to MQTT`);
    });

    this.mqtt.on('clientDisconnect', (client) => {
      log.debug(`${client.id} disconnected from MQTT`);
    });

    this.mqtt.authorizePublish = function (client, packet, cb) {
      if (!parser.parse(packet.topic, packet.payload.toString())) { // if invalid homie message, reject it
        return cb(null, false);
      }

      cb(null, true);
    };

    this.mqtt.authorizeSubscribe = function (client, sub, cb) {
      // anyone can subscribe to anything
      cb(null, sub);
    };

    this.mqtt.on('publish', (packet, client) => {
      if (packet.topic.startsWith('$SYS') || !client) { // client null if sent from aedes publish
        return;
      }

      this.emit('message', packet.topic, packet.payload.toString());
    });

    pauseable.pause(this.mqtt);
    this.server.listen(PORT, () => {
      let host = this.server.address().address;
      let port = this.server.address().port;
      this.emit('ready', { host: host, port: port });
    }).on('error', (err) => {
      this.emit('error', err);
    });
  }

  publish (packet) {
    this.mqtt.publish(packet);
  }
}

export default MqttServer;
