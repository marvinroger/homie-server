'use strict';

import test from 'tape';
import validator from '../lib/validators/property';

test('PropertyValidator.canReceive', function (t) {
  t.equal(validator.canReceive('foobar', 'level', '100'), false, 'fail on invalid type');
  t.equal(validator.canReceive('temperature', 'level', '100'), false, 'fail on invalid property');

  t.equal(validator.canReceive('light', 'on', '42'), false, 'fail if not boolean given');
  t.equal(validator.canReceive('light', 'on', 'true'), true, 'pass if true given');
  t.equal(validator.canReceive('light', 'on', 'false'), true, 'pass if false given');

  t.equal(validator.canReceive('temperature', 'temperature', '22'), true, 'pass if integer given');
  t.equal(validator.canReceive('temperature', 'temperature', '22.6'), true, 'pass if float given');
  t.equal(validator.canReceive('temperature', 'temperature', 'notafloat'), false, 'fail if string given');

  t.equal(validator.canReceive('shutters', 'level', '50'), true, 'pass if percentage given');
  t.equal(validator.canReceive('shutters', 'level', '112'), false, 'fail if number above 100 is given');
  t.equal(validator.canReceive('shutters', 'level', 'notapercentage'), false, 'fail if string is given');

  // test enum
  t.equal(validator.canReceive('heater', 'mode', 'comfort'), true, 'pass when good mode');
  t.equal(validator.canReceive('heater', 'mode', 'notamode'), false, 'fail when invalid mode');
  t.equal(validator.canReceive('heater', 'mode', '12'), false, 'fail when number given');

  t.end();
});

test('PropertyValidator.canSend', function (t) {
  t.equal(validator.canSend('temperature', 'temperature', '12'), false, 'fail when trying to send a non-settable property');

  t.equal(validator.canSend('light', 'on', 'true'), true, 'pass when trying to set a settabke property');

  t.end();
});

test('PropertyValidator.convertValue', function (t) {
  t.deepEqual(validator.convertValue('foobar', 'level', '100'), undefined, 'return undefined on non-existent type');
  t.deepEqual(validator.convertValue('temperature', 'level', '100'), undefined, 'return undefined on non-existent property');

  t.throws(() => validator.convertValue('light', 'on', '42'), 'throw when trying to convert a bad value');

  t.deepEqual(validator.convertValue('light', 'on', 'true'), true, 'return true on boolean');
  t.deepEqual(validator.convertValue('light', 'on', 'false'), false, 'return false on boolean');

  // test float
  t.deepEqual(validator.convertValue('temperature', 'temperature', '22'), 22.0, 'return float on integer');
  t.deepEqual(validator.convertValue('temperature', 'temperature', '22.6'), 22.6, 'return float on float');

  // test percentage
  t.deepEqual(validator.convertValue('shutters', 'level', '50'), 50, 'return integer on percentage');

  // test enum
  t.deepEqual(validator.convertValue('heater', 'mode', 'comfort'), 'comfort', 'return string on enum');

  t.end();
});
