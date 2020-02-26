import React from 'react';
import PropTypes from 'prop-types';
import TweenOne from 'rc-tween-one';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router';

class Examples extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    pageData: PropTypes.object
  };

  static defaultProps = {
    className: 'examples-list'
  };

  constructor(props) {
    super(props);
    this.state = {
      minHeight: '300px'
    };
  }

  componentDidMount() {
    this.state.minHeight = document.body.clientHeight - 130 + 'px';
  }

  calcMinHeight = () => {
    return {
      minHeight: document.body.clientHeight - 130 + 'px'
    };
  };

  render() {
    const { pageData, themeConfig } = this.props;
    const demo = pageData.demo;
    const source = themeConfig.source;
    const listChildren = Object.keys(demo)
      .map(key => demo[key])
      .sort((a, b) => b.meta.order - a.meta.order)
      .map(item => {
        const img = item.meta.image;
        const link = item.meta.link;
        // const link = _link.replace(/(\/index\.md)/g, '');
        const title = item.meta.chinese || item.meta.english;

        return (
          <li key={link}>
            <Link to={link}>
              <img src={img} width="100%" />
            </Link>
            <h3>{title}</h3>
          </li>
        );
      });
    return (
      <div className="page" style={{ minHeight: this.state.minHeight }}>
        <div className="page-wrapper">
          <TweenOne className={this.props.className} component="ul" animation={{ y: 30, type: 'from', opacity: 0 }}>
            {listChildren}
          </TweenOne>
        </div>
        <DocumentTitle title={`示例 - ${themeConfig.title}`} />
      </div>
    );
  }
}

export default Examples;
