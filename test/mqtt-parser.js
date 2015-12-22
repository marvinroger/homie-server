'use strict';

import test from 'tape';
import parser from '../lib/mqtt-parser';

test('MqttParser.parse', function (t) {
  // valid
  let topic = 'devices/2testilol1/$property';
  let message = 'value';
  t.deepEqual(parser.parse(topic, message), {
    type: 'deviceProperty',
    deviceId: '2testilol1',
    property: {
      name: 'property',
      value: message
    }
  });

  topic = 'devices/testilol/nodeid/property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), {
    type: 'nodeProperty',
    deviceId: 'testilol',
    nodeId: 'nodeid',
    property: {
      name: 'property',
      value: message
    }
  });

  topic = 'devices/3-testilol/nodeid/property/set';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), {
    type: 'set'
  });

  // invalid

  // too long
  topic = 'devices/testilol/nodeid/property/test/set';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // doesn't start with devices
  topic = 'lolipop/testilol/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // deviceId cannot contain anything else than a-z 0-9 -
  topic = 'devices/test123&/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // deviceId cannot start with a -
  topic = 'devices/-test/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // deviceId cannot end with a -
  topic = 'devices/test-/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // device property should start with a $
  topic = 'devices/testilol/property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // device property can't start with a $
  topic = 'devices/testilol/nodeid/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // cannot set a device property
  topic = 'devices/testilol/$property/set';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // nodeId cannot start with $
  topic = 'devices/testilol/$property/lol';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // a property name cannot be 'set'
  topic = 'devices/testilol/property/set';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  // 5 paths long can only be set messages
  topic = 'devices/testilol/nodeid/property/miaou';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false);

  t.end();
});
