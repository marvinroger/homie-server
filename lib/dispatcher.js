'use strict';

import {EventEmitter} from 'events';

class Dispatcher extends EventEmitter {
  constructor () {
    super();
    this.entities = {};
    this.ready = false;
  }

  attach (name, entity) {
    this.entities[name] = entity;
  }

  start () {
    this.entities.mqtt.on('homieMessage', (parsed) => {
      this.emit('homieMessage', parsed);
    });

    this.entities.infrastructure.on('update', (update) => {
      this.entities.gui.emitToWebsocket('infrastructureUpdate', update);
    });

    // WebSocket connect handler

    this.entities.gui.on('connection', (socket) => {
      socket.emit('infrastructure', this.entities['infrastructure'].getRepresentation());
      socket.emit('mqttClientStatus', this.entities.mqtt.getConnectionStatus());

      this.entities.mqtt.on('connection', () => {
        this.entities.gui.emitToWebsocket('mqttClientStatus', true);
      });

      this.entities.mqtt.on('disconnection', () => {
        this.entities.gui.emitToWebsocket('mqttClientStatus', false);
      });

      socket.on('setProperty', (data) => {
        this.entities.infrastructure.sendProperty(data);
      });
    });

    this.emit('ready');
    this.ready = true;
  }

  publishMqttMessage (packet) {
    this.entities.mqtt.publish(packet);
  }

  isReady () {
    return this.ready;
  }
}

export default new Dispatcher();
