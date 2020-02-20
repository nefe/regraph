import React from 'react';
import PropTypes from 'prop-types';
import Item from './Item';

class Demo extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    className: PropTypes.string,
    vertical: PropTypes.bool,
  };
  static defaultProps = {
    className: 'demo-layout',
  };
  static Item = Item;

  renderChildren = () =>
    React.Children.map(this.props.children, (item) => {
      if (item.type === Item) {
        const vertical = item.props.vertical;
        if (typeof vertical === 'boolean') {
          return item;
        }
        return React.cloneElement(item, { vertical: this.props.vertical });
      }
      return null;
    });

  render() {
    const props = { ...this.props };
    delete props.vertical;
    return (
      <div className={this.props.className} {...props}>
        <ul>
          {this.renderChildren()}
        </ul>
      </div>
    );
  }
}

export default Demo;
