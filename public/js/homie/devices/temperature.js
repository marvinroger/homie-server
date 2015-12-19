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
            { this.props.state.temperature }
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
    temperature: React.PropTypes.number
  })
};
