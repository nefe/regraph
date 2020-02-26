import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import TweenOne from 'rc-tween-one';
import QueueAnim from 'rc-queue-anim';

class Header extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired,
    isMobile: PropTypes.bool.isRequired
  };

  static defaultProps = {
    className: 'header'
  };

  constructor(props) {
    super(props);
    this.state = {
      openAnim: null,
      phoneOpen: false,
      barAnim: []
    };

    this.icon = '';
  }

  getAnimData = phoneOpen =>
    phoneOpen
      ? {
          phoneOpen: false,
          openAnim: { opacity: 0, delay: 300, duration: 400 },
          barAnim: [
            { rotate: 0, y: 0, duration: 300 },
            { opacity: 1, duration: 300 },
            { rotate: 0, y: 0, duration: 300 }
          ]
        }
      : {
          phoneOpen: true,
          openAnim: { opacity: 1, duration: 400 },
          barAnim: [
            { rotate: 45, y: 6, duration: 300 },
            { opacity: 0, duration: 300 },
            { rotate: -45, y: -6, duration: 300 }
          ]
        };

  phoneClick = (e, phoneOpen, href, isLogo) => {
    const { isMobile } = this.context;
    if (!isMobile || (isLogo && !phoneOpen)) {
      return;
    }
    if (href) {
      e.preventDefault();
      setTimeout(() => {
        this.context.router.push({
          pathname: href
        });
      }, 600);
    }
    this.setState(this.getAnimData(phoneOpen));
  };

  render() {
    const { isMobile } = this.context;
    const { themeConfig } = this.props;
    const navToRender = themeConfig.header.nav.map(item => {
      const className = this.props.activeKey === item.key ? 'active' : '';

      if (item.open) {
        return (
          <li key={item.key}>
            <Link to={item.href} target="_blank">
              {item.name}
            </Link>
          </li>
        );
      }
      return (
        <li key={item.key}>
          <Link
            to={item.href}
            className={className}
            disabled={item.disabled}
            onClick={e => {
              this.phoneClick(e, this.state.phoneOpen, item.href);
            }}>
            {item.name}
          </Link>
        </li>
      );
    });
    return (
      <header className={`${this.props.className}-wrapper${this.state.phoneOpen ? ' open' : ''}`}>
        <div className={this.props.className}>
          <TweenOne className={`${this.props.className}-logo`} animation={{ opacity: 0, type: 'from' }}>
            <Link
              href="/regraph"
              key="logo"
              onClick={e => {
                this.phoneClick(e, this.state.phoneOpen, '/', true);
              }}>
              {/* <img height="24" src={this.icon} /> */}
              ReGraph
            </Link>
          </TweenOne>
          {isMobile ? (
            <div className="phone-nav">
              <div
                className="phone-nav-bar"
                onClick={e => {
                  this.phoneClick(e, this.state.phoneOpen);
                }}>
                <TweenOne component="em" animation={this.state.barAnim[0]} />
                <TweenOne component="em" animation={this.state.barAnim[1]} />
                <TweenOne component="em" animation={this.state.barAnim[2]} />
              </div>
              <TweenOne
                className="phone-nav-text-wrapper"
                animation={this.state.openAnim}
                style={{ pointerEvents: this.state.phoneOpen ? 'auto' : 'none' }}>
                <QueueAnim
                  component="ul"
                  duration={150}
                  interval={50}
                  delay={[200, 0]}
                  ease={['easeOutQuad', 'easeInQuad']}
                  type="bottom"
                  leaveReverse>
                  {this.state.phoneOpen && navToRender}
                </QueueAnim>
              </TweenOne>
            </div>
          ) : (
            <TweenOne component="nav" className="web-nav" animation={{ opacity: 0, type: 'from' }}>
              <ul>{navToRender}</ul>
            </TweenOne>
          )}
        </div>
      </header>
    );
  }
}

export default Header;
