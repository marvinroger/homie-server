'use strict';

import {EventEmitter} from 'events';

class Dispatcher extends EventEmitter {
  constructor () {
    super();
    this.entities = {};
  }

  attach (name, entity) {
    this.entities[name] = entity;
  }

  start () {
    this.emit('ready');

    this.entities.mqtt.on('message', (topic, message) => {
      this.emit('homieMessage', topic.toString(), message.toString());
    });

    this.entities.infrastructure.on('update', (update) => {
      this.entities.gui.emitToWebsocket('infrastructure_updated', update);
    });

    // WebSocket connect handler

    this.entities.gui.on('connection', (socket) => {
      socket.emit('infrastructure', this.entities['infrastructure'].getRepresentation());

      socket.on('set_property', (data) => {
        this.entities.infrastructure.sendProperty(data);
      });
    });
  }

  publishMqttMessage (packet) {
    this.entities.mqtt.publish(packet);
  }
}

export default new Dispatcher();
