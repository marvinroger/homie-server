'use strict';

import React from 'react';
import classNames from 'classnames';

export default class Menu extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      active: 'all'
    };
  }

  onMenuChange (id) {
    this.props.onMenuChange(id);
    this.setState({ active: id });
  }

  render () {
    let groupsWithAll = this.props.groups.slice(0); // needed to clone, else it modifies original props
    groupsWithAll.unshift({ id: 'all', 'name': 'Tout' });

    let groups = groupsWithAll.map((group, index) => {
      let itemClasses = classNames({
        'item': true,
        'active': this.state.active === group.id
      });

      return (
        <a className={ itemClasses } onClick={() => this.onMenuChange(group.id)} key={index}>
          {group.name}
        </a>
      );
    });

    return (
      <div className='ui text menu'>
        <div className='item'>
          <img className='logo' src='img/logo.png'/>
          Homie
        </div>

        {groups}
      </div>
    );
  }
}

Menu.propTypes = {
  groups: React.PropTypes.array.isRequired,
  onMenuChange: React.PropTypes.func.isRequired
};
