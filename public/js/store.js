'use strict';

import { createStore } from 'redux';
import socketio from 'socket.io-client';
import jsonpatch from 'fast-json-patch';

const INITIAL = 'INITIAL';
const PATCH = 'PATCH';
const SET_PROPERTY = 'SET_PROPERTY';

function infrastructure (state = { devices: [], groups: [], loading: true }, action) {
  switch (action.type) {
    case INITIAL:
      action.initial.loading = false;
      return action.initial;
    case PATCH:
      jsonpatch.apply(state, action.patch);
      return state;
    case SET_PROPERTY:
      socket.emit('set_property', action.property);
      return state;
    default:
      return state;
  }
}

let store = createStore(infrastructure);
let socket = socketio();

socket.once('infrastructure', (data) => {
  store.dispatch({ type: INITIAL, initial: data });
});

socket.on('infrastructure_updated', (data) => {
  store.dispatch({ type: PATCH, patch: data });
});

export default store;

export function setProperty (property) {
  return {
    type: SET_PROPERTY,
    property: property
  };
}
