'use strict';

let validator = require('validator');
let types = require('./nodes/types').types;

class PropertyValidator {
  _getPropertyObject (type, property) {
    let typeObject = types.filter((iType) => {
      return iType.name === type;
    })[0];

    if (!typeObject) {
      return false;
    }

    let propertyObject = typeObject.properties.filter((iProperty) => {
      return iProperty.name === property;
    })[0];

    if (!propertyObject) {
      return false;
    }

    return propertyObject;
  }

  canReceive (type, property, value) {
    let propertyObject = this._getPropertyObject(type, property);
    if (!propertyObject) {
      return false;
    }

    switch (propertyObject.type) {
      case 'boolean':
        return validator.isIn(value, ['true', 'false']);
      case 'float':
        return validator.isFloat(value);
      case 'percentage':
        return validator.isInt(value, { min: 0, max: 100 });
      case 'enum':
        return validator.isIn(value, propertyObject.oneOf);
      case 'blank':
        return true;
      case 'string':
        return true;
      default:
        return false;
    }
  }

  canSend (type, property, value) {
    if (!this.canReceive()) {
      return false;
    }

    let propertyObject = this._getPropertyObject(type, property);
    return propertyObject.settable;
  }

  convertValue (type, property, value) {
    let propertyObject = this._getPropertyObject(type, property);
    if (!propertyObject) {
      return undefined;
    }

    switch (propertyObject.type) {
      case 'boolean':
        return value === 'true';
      case 'float':
        return parseFloat(value);
      case 'percentage':
        return parseInt(value, 10);
      case 'enum':
        return value;
      case 'blank':
        return null;
      case 'string':
        return value;
      default:
        return undefined;
    }
  }
}

module.exports = new PropertyValidator();
