'use strict';

import React from 'react';

import Device from '../device';

export default class Shutters extends React.Component {
  constructor (props) {
    super(props);
  }

  open () {
    this.refs['device'].setProperty('level', 0);
  }

  half () {
    this.refs['device'].setProperty('level', 50);
  }

  close () {
    this.refs['device'].setProperty('level', 100);
  }

  render () {
    return (
      <Device image={typeof this.props.state.current.level === 'undefined' ? undefined : this.props.state.current.level === 100 ? 100 : this.props.state.current.level >= 90 ? 90 : this.props.state.current.level >= 80 ? 80 : this.props.state.current.level >= 70 ? 70 : this.props.state.current.level >= 60 ? 60 : this.props.state.current.level >= 50 ? 50 : this.props.state.current.level >= 40 ? 40 : this.props.state.current.level >= 30 ? 30 : this.props.state.current.level >= 20 ? 20 : this.props.state.current.level >= 10 ? 10 : 0} color='#f1c40f' ref='device' {...this.props}>
        <div className='ui three buttons'>
          <button className='ui green icon compact button' onClick={() => this.open()}>
            <i className='chevron up icon'></i>
          </button>
          <button className='ui orange compact button' onClick={() => this.half()}>
            50%
          </button>
          <button className='ui red icon compact button' onClick={() => this.close()}>
            <i className='chevron down icon'></i>
          </button>
        </div>
      </Device>
    );
  }
}

Shutters.propTypes = {
  state: React.PropTypes.shape({
    current: React.PropTypes.shape({
      level: React.PropTypes.number
    })
  })
};
