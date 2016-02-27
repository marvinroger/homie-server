'use strict';

import {EventEmitter} from 'events';

import mqtt from 'mqtt';
import pauseable from 'pauseable';

import dispatcher from '../dispatcher';
import parser from '../mqtt-parser';
import log from '../log';

class MqttClient extends EventEmitter {
  constructor (options) {
    super();

    this.options = options;
    this.connected = false;
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
      this.connected = true;
      if (!dispatcher.isReady()) {
        pauseable.pause(this.client);
      }
      this.client.subscribe('devices/#');
      this.emit('connection');
      log.info('Connected to the MQTT broker');
    });

    const disconnected = () => {
      if (this.connected) { // else this is triggered every few secs
        this.connected = false;
        this.emit('disconnection');
        log.error('Disconnected from the MQTT broker');
      }
    };

    this.client.on('offline', () => {
      disconnected();
    });

    this.client.on('close', () => {
      disconnected();
    });

    this.client.on('message', (topic, message) => {
      const parsed = parser.parse(topic, message.toString());
      if (!parsed) {
        return;
      }

      this.emit('homieMessage', parsed);
    });
  }

  publish (packet) {
    this.client.publish(packet.topic, packet.payload, {
      qos: packet.qos,
      retain: packet.retain
    });
  }

  getConnectionStatus () {
    return this.connected;
  }
}

export default MqttClient;
