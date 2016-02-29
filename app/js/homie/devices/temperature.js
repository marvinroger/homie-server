'use strict';

import React from 'react';

import Device from '../device';

export default class Temperature extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <Device image='thermometer' color='#e67e22' {...this.props}>
        <div className='ui small horizontal statistic'>
          <div className='value'>
            { typeof this.props.state.current.temperature !== 'undefined' ? this.props.state.current.temperature : '?' }
          </div>
          <div className='label'>
            °C
          </div>
        </div>
      </Device>
    );
  }
}

Temperature.propTypes = {
  state: React.PropTypes.shape({
    current: React.PropTypes.shape({
      temperature: React.PropTypes.number
    })
  })
};
