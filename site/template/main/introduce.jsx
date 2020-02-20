import React from 'react';
import PropTypes from 'prop-types';
import OverPack from 'rc-scroll-anim/lib/ScrollOverPack';
import QueueAnim from 'rc-queue-anim';
import TweenOne from 'rc-tween-one';
import {Link} from 'react-router';
import Code from '../components/Code';

class Introduce extends React.Component {
  static propTypes = {
    pageData: PropTypes.object,
    utils: PropTypes.object,
    tweenAnim: PropTypes.object,
    onButtonClick: PropTypes.func,
    title: PropTypes.string,
    introduce: PropTypes.string,
    content: PropTypes.string,
    more: PropTypes.object
  };

  static defaultProps = {
    pageData: {},
    utils: {},
    tweenAnim: {},
    onButtonClick: () => {}
  };

  render () {
    const {
      title,
      introduce,
      content,
      more
    } = this.props;
    return (
      <div className="main-page-wrapper introduce">
        <OverPack
          playScale={0.6}
          className="page vh"
          id="introduce">
          <QueueAnim className="page-text" key="text" type="bottom" leaveReverse delay={100}>
            <h1 key="h1">{title}</h1>
            <p key="p">{introduce}</p>
          </QueueAnim>
          <TweenOne
            className="code-wrapper clearfix"
            animation={{...this.props.tweenAnim, delay: 200}}
            key="code">
            <Code className="code" pageData={this.props.pageData} utils={this.props.utils}/>
          </TweenOne>
          <TweenOne
            key="a"
            className="home-button"
            animation={{...this.props.tweenAnim, delay: 300}}>
            <Link to={more.link} onClick={this.props.onButtonClick}>{more.label}</Link>
          </TweenOne>
        </OverPack>
      </div>
    );
  }
}

export default Introduce
