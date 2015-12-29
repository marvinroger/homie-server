'use strict';

import test from 'tape';
import validator from '../lib/validators/datadir';

test('DataDirValidator.validateOtaManifest', function (t) {
  t.plan(5);

  validator.validateOtaManifest(null, false).then((valid) => {
    t.equal(valid, false, 'fail when null');
  });

  validator.validateOtaManifest({}, false).then((valid) => {
    t.equal(valid, false, 'fail when empty object');
  });

  validator.validateOtaManifest({ firmwares: [] }, false).then((valid) => {
    t.equal(valid, true, 'pass when empty firmwares');
  });

  validator.validateOtaManifest({ firmwares: [ { name: 'ota', version: '1.0.0', devices: ['device'] } ] }, false).then((valid) => {
    t.equal(valid, true, 'pass when valid fulfilled manifest');
  });

  validator.validateOtaManifest({ firmwares: [ { name: 'ota', version: '1.0.0', devices: ['device'] }, { name: 'ota2', version: '1.0.0', devices: ['device'] } ] }, false).then((valid) => {
    t.equal(valid, false, 'fail when multiple firmwares for a device');
  });
});

test('DataDirValidator.validateInfrastructure', function (t) {
  let valid;
  valid = validator.validateInfrastructure(null);
  t.equal(valid, false, 'fail when null');

  valid = validator.validateInfrastructure({});
  t.equal(valid, false, 'fail when empty object');

  valid = validator.validateInfrastructure({ devices: [], groups: [] });
  t.equal(valid, true, 'pass when empty infrastructure');

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
  t.equal(valid, false, 'fail when duplicate device id');

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
  t.equal(valid, false, 'fail when duplicate node id');

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
  t.equal(valid, false, 'fail when duplicate group id');

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
  t.equal(valid, false, 'fail when non-existent device id in group');

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
  t.equal(valid, false, 'fail when invalid node type');

  t.end();
});
