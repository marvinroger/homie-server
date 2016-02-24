'use strict';

import {EventEmitter} from 'events';

import mqtt from 'mqtt';
import pauseable from 'pauseable';

import dispatcher from '../dispatcher';
import parser from '../mqtt-parser';

class MqttClient extends EventEmitter {
  constructor (options) {
    super();

    this.options = options;
  }

  start () {
    this.client = mqtt.connect(this.options.url, {
      clientId: this.options.clientId ? this.options.clientId : `HomieServer-${Math.random().toString(16).substr(2, 8)}`,
      username: this.options.username,
      password: this.options.password
    });

    dispatcher.on('ready', () => {
      pauseable.resume(this.client);
    });

    this.client.on('connect', () => {
      pauseable.pause(this.client);
      this.client.subscribe('devices/#');
      this.emit('ready');
    });

    this.client.on('message', (topic, message) => {
      const parsed = parser.parse(topic, message.toString());
      if (!parsed) {
        return;
      }

      this.emit('message', topic, message.toString());
    });
  }

  publish (packet) {
    this.client.publish(packet.topic, packet.payload, {
      qos: packet.qos,
      retain: packet.retain
    });
  }
}

export default MqttClient;
