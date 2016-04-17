'use strict';

import immutable from 'immutable';

import { createStore } from 'redux';
import socketio from 'socket.io-client';

const SET_CONNECTION = 'SET_CONNECTION';
const INFRASTRUCTURE = 'INFRASTRUCTURE';
const DEVICE_STATE_UPDATE = 'DEVICE_STATE_UPDATE';
const NODE_CURRENT_STATE_UPDATE = 'NODE_CURRENT_STATE_UPDATE';
const NODE_WANTED_STATE_UPDATE = 'NODE_WANTED_STATE_UPDATE';
const SET_PROPERTY = 'SET_PROPERTY';
const MQTT_STATUS = 'MQTT_STATUS';

let immutableState = immutable.Map({
  devices: {}, groups: [], loading: true, connection: true, mqttStatus: false
});

function infrastructure (state = immutableState.toJS(), action) {
  switch (action.type) {
    case SET_CONNECTION:
      immutableState = immutableState.set('connection', action.connection);
      return immutableState.toJS();
    case INFRASTRUCTURE:
      immutableState = immutableState.set('loading', false);
      immutableState = immutableState.mergeDeep(action.initial);
      return immutableState.toJS();
    case DEVICE_STATE_UPDATE:
      immutableState = immutableState.setIn(['devices', action.update.deviceId, 'state', action.update.property], action.update.value);
      return immutableState.toJS();
    case NODE_CURRENT_STATE_UPDATE:
      immutableState = immutableState.setIn(['devices', action.update.deviceId, 'nodes', action.update.nodeId, 'state', 'current', action.update.property], action.update.value);
      return immutableState.toJS();
    case NODE_WANTED_STATE_UPDATE:
      immutableState = immutableState.setIn(['devices', action.update.deviceId, 'nodes', action.update.nodeId, 'state', 'wanted', action.update.property], action.update.value);
      return immutableState.toJS();
    case SET_PROPERTY:
      socket.emit('setProperty', action.property);
      return immutableState.toJS();
    case MQTT_STATUS:
      immutableState = immutableState.set('mqttStatus', action.connected);
      return immutableState.toJS();
    default:
      return state;
  }
}

let store = createStore(infrastructure);
let socket = socketio();

// Socket connection / disconnection

socket.on('connect', () => {
  store.dispatch({ type: SET_CONNECTION, connection: true });
});

socket.on('disconnect', () => {
  store.dispatch({ type: SET_CONNECTION, connection: false });
});

// Data right after connection

socket.once('infrastructure', (data) => {
  store.dispatch({ type: INFRASTRUCTURE, initial: data });
});

// Data coming anytime

socket.on('infrastructureUpdate', (update) => {
  switch (update.type) {
    case 'deviceState':
      store.dispatch({ type: DEVICE_STATE_UPDATE, update: update });
      break;
    case 'nodeCurrentState':
      store.dispatch({ type: NODE_CURRENT_STATE_UPDATE, update: update });
      break;
    case 'nodeWantedState':
      store.dispatch({ type: NODE_WANTED_STATE_UPDATE, update: update });
      break;
  }
});

socket.on('mqttClientStatus', (connected) => {
  store.dispatch({ type: MQTT_STATUS, connected });
});

export default store;

export function setProperty (property) {
  return {
    type: SET_PROPERTY,
    property: property
  };
}
