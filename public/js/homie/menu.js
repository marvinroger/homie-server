/* global $ */

'use strict';

import React from 'react';
import classNames from 'classnames';

export default class Menu extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      active: { id: 'all', name: 'Tout' }
    };
  }

  componentDidMount () {
    $('.ui.dropdown').dropdown();
  }

  componentDidUpdate () {
    $('.ui.dropdown').dropdown();
  }

  onMenuChange (group) {
    this.props.onMenuChange(group);
    this.setState({ active: group });
  }

  render () {
    let groupsWithAll = this.props.groups.slice(0); // needed to clone, else it modifies original props
    groupsWithAll.unshift({ id: 'all', 'name': 'Tout' });

    let groups = groupsWithAll.map((group, index) => {
      let itemClasses = classNames({
        'item': true,
        'active': this.state.active.id === group.id
      });

      return (
        <a className={ itemClasses } onClick={() => this.onMenuChange(group)} key={index}>
          {group.name}
        </a>
      );
    });

    return (
      <div>
        <div className='ui text menu'>
          <div className='item'>
            <img className='logo' src='img/logo.png'/>
            Homie
          </div>
        </div>

        <div className='ui dropdown'>
          {this.state.active.name} <i className='dropdown icon'></i>
          <div className='menu'>
            {groups}
          </div>
        </div>
        <br/><br/>
      </div>
    );
  }
}

Menu.propTypes = {
  groups: React.PropTypes.array.isRequired,
  onMenuChange: React.PropTypes.func.isRequired
};
