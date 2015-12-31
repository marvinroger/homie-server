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
    this.entities['Homie'].on('message', (topic, message) => {
      this.emit('homieMessage', topic.toString(), message.toString());
    });

    this.entities['infrastructure'].on('update', (patch) => {
      this.entities['GUI'].emitToWebsocket('infrastructure_updated', patch);
    });

    // WebSocket connect handler

    this.entities['GUI'].on('connection', (socket) => {
      socket.emit('infrastructure', this.entities['infrastructure'].getRepresentation());

      socket.on('set_property', (data) => {
        this.entities['infrastructure'].sendProperty(data);
      });
    });
  }

  publishMqttMessage (packet) {
    this.entities['Homie'].publish(packet);
  }
}

export default new Dispatcher();
