'use strict';

import React from 'react';

import Device from '../device';

export default class Heater extends React.Component {
  constructor (props) {
    super(props);
  }

  toggle (value) {
    this.refs['device'].setProperty('mode', value);
  }

  render () {
    return (
      <Device image={this.props.state.mode} color='#1abc9c' {...this.props}>
        <div className='ui four buttons'>
          <button className='ui blue basic icon compact button' onClick={() => this.toggle('anti-freeze')}>
            <i className='asterisk icon'></i>
            HGel
          </button>
          <button className='ui orange basic icon compact button' onClick={() => this.toggle('comfort')}>
            <i className='sun icon'></i>
            Conf
          </button>
          <button className='ui purple basic icon compact button' onClick={() => this.toggle('economic')}>
            <i className='moon icon'></i>
            Éco
          </button>
          <button className='ui black basic icon compact button' onClick={() => this.toggle('off')}>
            <i className='toggle off icon'></i>
            OFF
          </button>
        </div>
      </Device>
    );
  }
}

Heater.propTypes = {
  state: React.PropTypes.shape({
    mode: React.PropTypes.string
  })
};
