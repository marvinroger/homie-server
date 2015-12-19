'use strict';

import Reflux from 'reflux';
import socketio from 'socket.io-client';
import jsonpatch from 'fast-json-patch';

import InfrastructureActions from './infrastructure-actions';

let _socket = socketio();
let _infrastructure = {};

let InfrastructureStore = Reflux.createStore({
  init: function () {
    this.listenTo(InfrastructureActions.getInfrastructure, this.onGet);
    this.listenTo(InfrastructureActions.setProperty, this.onSetProperty);

    _socket.on('infrastructure_updated', (data) => {
      jsonpatch.apply(_infrastructure, data);
      this.trigger(_infrastructure);
    });
  },

  onGet: function () {
    _socket.once('infrastructure', (data) => {
      _infrastructure = data;
      this.trigger(_infrastructure);
    });
  },

  onSetProperty: function (data) {
    _socket.emit('set_property', data);
  }
});

export default InfrastructureStore;
