'use strict';

import React from 'react';

import Device from '../device';

export default class Light extends React.Component {
  constructor (props) {
    super(props);
  }

  toggle (value) {
    this.refs['device'].setProperty('on', value);
  }

  render () {
    return (
      <Device image={typeof this.props.state.on === 'undefined' ? undefined : this.props.state.on ? 'on' : 'off'} color='#ea6153' ref='device' {...this.props}>
        <div className='ui two buttons'>
          <button className='ui green compact button' onClick={() => this.toggle('true')}>
            ON
          </button>
          <button className='ui red compact button' onClick={() => this.toggle('false')}>
            OFF
          </button>
        </div>
      </Device>
    );
  }
}

Light.propTypes = {
  state: React.PropTypes.shape({
    on: React.PropTypes.bool
  })
};
