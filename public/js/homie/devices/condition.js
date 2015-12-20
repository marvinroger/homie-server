'use strict';

import React from 'react';

import Device from '../device';

export default class Condition extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    let conditionText = undefined;
    switch (this.props.state.condition) {
      case 'clear-day':
        conditionText = 'Jour clair';
        break;
      case 'clear-night':
        conditionText = 'Nuit claire';
        break;
      case 'rain':
        conditionText = 'Pluvieux';
        break;
      case 'snow':
        conditionText = 'Neigeux';
        break;
      case 'sleet':
        conditionText = 'Neige fondue';
        break;
      case 'wind':
        conditionText = 'Vent';
        break;
      case 'fog':
        conditionText = 'Brouillard';
        break;
      case 'cloudy':
        conditionText = 'Nuageux';
        break;
      case 'partly-cloudy-day':
        conditionText = 'Jour partiellement nuageux';
        break;
      case 'partly-cloudy-night':
        conditionText = 'Nuit partiellement nuageuse';
        break;
    }

    return (
      <Device image={this.props.state.condition} color='#325159' {...this.props}>
        <h3 style={{ color: '#1B1C1D' }}>
          { typeof conditionText !== 'undefined' ? conditionText : '?' }
        </h3>
      </Device>
    );
  }
}

Condition.propTypes = {
  state: React.PropTypes.shape({
    condition: React.PropTypes.string
  })
};
