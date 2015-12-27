'use strict';

import test from 'tape';
import validator from '../lib/validators/datadir';

test('DataDirValidator.validateOtaManifest', function (t) {
  t.plan(5);

  // null
  validator.validateOtaManifest(null, false).then((valid) => {
    t.equal(valid, false);
  });
  // empty object
  validator.validateOtaManifest({}, false).then((valid) => {
    t.equal(valid, false);
  });
  // empty firmwares
  validator.validateOtaManifest({ firmwares: [] }, false).then((valid) => {
    t.equal(valid, true);
  });
  // valid manifest
  validator.validateOtaManifest({ firmwares: [ { name: 'ota', version: '1.0.0', devices: ['device'] } ] }, false).then((valid) => {
    t.equal(valid, true);
  });
  // multiple firmwares for a device
  validator.validateOtaManifest({ firmwares: [ { name: 'ota', version: '1.0.0', devices: ['device'] }, { name: 'ota2', version: '1.0.0', devices: ['device'] } ] }, false).then((valid) => {
    t.equal(valid, false);
  });
});

test('DataDirValidator.validateInfrastructure', function (t) {
  let valid;
  // null
  valid = validator.validateInfrastructure(null);
  t.equal(valid, false);
  // empty object
  valid = validator.validateInfrastructure({});
  t.equal(valid, false);
  // empty infrastructure
  valid = validator.validateInfrastructure({ devices: [], groups: [] });
  t.equal(valid, true);
  // duplicate device ids
  valid = validator.validateInfrastructure({
    devices: [
      {
        id: 'test',
        name: 'test',
        location: 'test',
        nodes: [{
          type: 'heater',
          id: 'heater',
          name: 'Heater'
        }]
      },
      {
        id: 'test',
        name: 'test',
        location: 'test',
        nodes: [{
          type: 'light',
          id: 'light',
          name: 'light'
        }]
      }
    ], groups: []
  });
  t.equal(valid, false);
  // duplicate node ids
  valid = validator.validateInfrastructure({
    devices: [
      {
        id: 'test',
        name: 'test',
        location: 'test',
        nodes: [{
          type: 'heater',
          id: 'heater',
          name: 'Heater'
        }, {
          type: 'light',
          id: 'heater',
          name: 'Light'
        }]
      }
    ], groups: []
  });
  t.equal(valid, false);
  // duplicate group ids
  valid = validator.validateInfrastructure({
    devices: [
      {
        id: 'test',
        name: 'test',
        location: 'test',
        nodes: [{
          type: 'heater',
          id: 'heater',
          name: 'Heater'
        }]
      },
      {
        id: 'test2',
        name: 'test',
        location: 'test',
        nodes: [{
          type: 'light',
          id: 'light',
          name: 'light'
        }]
      }
    ], groups: [{
      id: 'group1',
      name: 'group1',
      devices: ['test']
    }, {
      id: 'group1',
      name: 'group2',
      devices: ['test2']
    }]
  });
  t.equal(valid, false);
  // invalid device in group
  valid = validator.validateInfrastructure({
    devices: [
      {
        id: 'test',
        name: 'test',
        location: 'test',
        nodes: [{
          type: 'heater',
          id: 'heater',
          name: 'Heater'
        }]
      }
    ], groups: [{
      id: 'group1',
      name: 'group1',
      devices: ['dontexist']
    }]
  });
  t.equal(valid, false);
  // invalid node types
  valid = validator.validateInfrastructure({
    devices: [
      {
        id: 'test',
        name: 'test',
        location: 'test',
        nodes: [{
          type: 'foooobar',
          id: 'heater',
          name: 'Heater'
        }]
      }
    ], groups: []
  });
  t.equal(valid, false);

  t.end();
});
