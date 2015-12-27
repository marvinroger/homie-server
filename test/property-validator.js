'use strict';

import test from 'tape';
import validator from '../lib/validators/property';

test('PropertyValidator.canReceive', function (t) {
  // non-existent type
  t.equal(validator.canReceive('foobar', 'level', '100'), false);
  // non-existent property
  t.equal(validator.canReceive('temperature', 'level', '100'), false);

  // test boolean
  t.equal(validator.canReceive('light', 'on', '42'), false);
  t.equal(validator.canReceive('light', 'on', 'true'), true);
  t.equal(validator.canReceive('light', 'on', 'false'), true);

  // test float
  t.equal(validator.canReceive('temperature', 'temperature', '22'), true);
  t.equal(validator.canReceive('temperature', 'temperature', '22.6'), true);
  t.equal(validator.canReceive('temperature', 'temperature', 'notafloat'), false);

  // test percentage
  t.equal(validator.canReceive('shutters', 'level', '50'), true);
  t.equal(validator.canReceive('shutters', 'level', '112'), false);
  t.equal(validator.canReceive('shutters', 'level', 'notapercentage'), false);

  // test enum
  t.equal(validator.canReceive('heater', 'mode', 'comfort'), true);
  t.equal(validator.canReceive('heater', 'mode', 'notamode'), false);
  t.equal(validator.canReceive('heater', 'mode', '12'), false);

  t.end();
});

test('PropertyValidator.canSend', function (t) {
  // not settable
  t.equal(validator.canSend('temperature', 'temperature', '12'), false);

  // settable
  t.equal(validator.canSend('light', 'on', 'true'), true);

  t.end();
});

test('PropertyValidator.convertValue', function (t) {
  // non-existent type
  t.deepEqual(validator.convertValue('foobar', 'level', '100'), undefined);
  // non-existent property
  t.deepEqual(validator.convertValue('temperature', 'level', '100'), undefined);

  // test bad value
  t.throws(() => validator.convertValue('light', 'on', '42'));

  // test boolean
  t.deepEqual(validator.convertValue('light', 'on', 'true'), true);
  t.deepEqual(validator.convertValue('light', 'on', 'false'), false);

  // test float
  t.deepEqual(validator.convertValue('temperature', 'temperature', '22'), 22.0);
  t.deepEqual(validator.convertValue('temperature', 'temperature', '22.6'), 22.6);

  // test percentage
  t.deepEqual(validator.convertValue('shutters', 'level', '50'), 50);

  // test enum
  t.deepEqual(validator.convertValue('heater', 'mode', 'comfort'), 'comfort');

  t.end();
});
