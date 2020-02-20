import React from 'react';
import PropTypes from 'prop-types';
import OverPack from 'rc-scroll-anim/lib/ScrollOverPack';
import QueueAnim from 'rc-queue-anim';
import TweenOne from 'rc-tween-one';
import {Link} from 'react-router';

class Exhibition extends React.Component {
  static propTypes = {
    pageData: PropTypes.object,
    utils: PropTypes.object,
    tweenAnim: PropTypes.object,
    onButtonClick: PropTypes.func,
    exhibition: PropTypes.object
  };

  static defaultProps = {
    pageData: {},
    utils: {},
    tweenAnim: {},
    onButtonClick: () => {},
    exhibition: {}
  };

  render () {
    const {pageData, exhibition, themeConfig, utils} = this.props;
    const examples = pageData['examples']['demo']
    const demoToChildren = Object.keys(examples)
      .map(key => examples[key])
      .sort((a, b) => b.meta.order - a.meta.order)
      .filter((key, i) => i < 6)
      .map((item) => {
        const img = item.meta.image;
        let link = item.meta.filename.replace(/(.md)/g, '');
        if (themeConfig.source) {
          link = link.replace(new RegExp(themeConfig.source), '');
        }
        const title = item.meta.chinese || item.meta.english;
        const content = utils.toReactComponent(item.description);
        return (<li key={link}>
          <Link to={link} onClick={this.props.onButtonClick}>
            <div className="home-anim-demo-img"><img src={img} width="100%"/></div>
            <h2>{title}</h2>
            <div className="home-anim-demo-text">{content}</div>
          </Link>
        </li>);
      });

    return (
      <div className="main-page-wrapper exhibition">
        <OverPack
          className="page"
          playScale={0.6}
          id="exhibition">
          <QueueAnim
            className="page-text"
            key="text"
            type="bottom"
            leaveReverse
            delay={[0, 100]}>
            <h1 key="h1">{exhibition.title}</h1>
            <p key="p">{exhibition.content}</p>
          </QueueAnim>
          <TweenOne
            animation={{delay: 200, ...this.props.tweenAnim}}
            key="img"
            className="home-anim-demo clearfix">
            <ul>
              {demoToChildren}
            </ul>
          </TweenOne>
          <TweenOne
            key="a"
            animation={{delay: 300, ...this.props.tweenAnim}}
            className="home-button">
            <Link to={exhibition.more.link} onClick={this.props.onButtonClick}>{exhibition.more.label}</Link>
          </TweenOne>
        </OverPack>
      </div>
    );
  }
}

export default Exhibition;
