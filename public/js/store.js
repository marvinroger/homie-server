'use strict';

import immutable from 'immutable';

import { createStore } from 'redux';
import socketio from 'socket.io-client';
import immpatch from 'immpatch';

const INITIAL = 'INITIAL';
const PATCH = 'PATCH';
const SET_PROPERTY = 'SET_PROPERTY';

let immutableState = immutable.Map({
  devices: [], groups: [], loading: true
});

function infrastructure (state = immutableState.toJS(), action) {
  switch (action.type) {
    case INITIAL:
      immutableState = immutableState.set('loading', false);
      immutableState = immutableState.mergeDeep(action.initial);
      return immutableState.toJS();
    case PATCH:
      immutableState = immpatch(immutableState, action.patch);
      return immutableState.toJS();
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
