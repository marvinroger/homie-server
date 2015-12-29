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
  }, 'parse device property');

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
  }, 'parse node property');

  topic = 'devices/3-testilol/nodeid/property/set';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), {
    type: 'set'
  }, 'parse set node property');

  // invalid
  topic = 'devices/testilol/nodeid/property/test/set';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when too long topic');

  topic = 'lolipop/testilol/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when not starting with devices/');

  topic = 'devices/test123&/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when deviceId contains invalid chars');

  topic = 'devices/-test/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when deviceId starts with a -');

  topic = 'devices/test-/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when deviceId ends with a -');

  topic = 'devices/testilol/property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when device property not starting with $');

  topic = 'devices/testilol/nodeid/$property';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when node property starting with $');

  topic = 'devices/testilol/$property/set';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when setting a device property');

  topic = 'devices/testilol/$property/lol';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when nodeId starts with $');

  topic = 'devices/testilol/property/set';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when property name is set');

  topic = 'devices/testilol/nodeid/property/miaou';
  message = 'value';
  t.deepEqual(parser.parse(topic, message), false, 'fail when 5 paths long message is not set');

  t.end();
});
