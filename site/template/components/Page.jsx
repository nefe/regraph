import React from 'react';
import PropTypes from 'prop-types';
import { TweenOneGroup } from 'rc-tween-one';
import { Link } from 'react-router';
import { Affix, Row, Col, Menu } from 'antd';
import MobileMenu from 'rc-drawer';
import { scrollClick, getMenuItems, fileNameToPath } from '../utils';
import { getChildren } from 'jsonml.js/lib/utils';

const { SubMenu, Item, ItemGroup } = Menu;

class Page extends React.PureComponent {
  static propTypes = {
    pageData: PropTypes.object
  };

  static defaultProps = {
    className: 'page'
  };

  constructor(props) {
    super(props);
    this.state = {
      isHash: false,
      minHeight: '300px'
    };
  }

  componentDidMount() {
    this.componentDidUpdate();
    this.enter = true;
    this.state.minHeight = document.body.clientHeight - 130 + 'px';
  }

  componentDidUpdate() {
    this.hash = null;
    this.state.isHash = false;
    this.componentWillUnmount();
  }

  componentWillUnmount() {
    this.hash = null;
    if (window.addEventListener) {
      window.removeEventListener('scroll', this.onScroll);
    } else {
      window.detachEvent('onscroll', this.onScroll);
    }
  }

  onScroll = () => {
    if (this.hash !== window.location.hash) {
      this.hash = window.location.hash;
      this.setState({
        isHash: true
      });
    }
  };

  getModuleData = pageData => {
    if (!pageData) {
      return null;
    }
    const moduleData = {};
    Object.keys(pageData).forEach(key => {
      const children = Object.keys(pageData[key]).map(cKey => pageData[key][cKey].index || pageData[key][cKey]);
      moduleData[key] = children;
    });
    return moduleData;
  };

  getListChildren = (moduleData, pathNames, pathKey, isMobile) => {
    const { themeConfig, pathname } = this.props;
    const _title = themeConfig.header.nav.filter(_item => _item['key'] === pathKey);
    const listToRender = moduleData && this.getMenuItems(moduleData[pathNames[0]], pathNames);
    const listKey = pathNames[0] === 'components' && !pathname.match('api') ? pathname : pathNames[1];
    const getHashActive = () => {
      const hashArray = this.hash.replace('#', '').split('-');
      return hashArray[hashArray.length - 1];
    };
    const activeMenuItem = this.state.isHash ? getHashActive() : pathNames[1];
    const menu = (
      <Menu
        key={listKey}
        inlineIndent="16"
        mode="inline"
        defaultOpenKeys={this.openKeys}
        selectedKeys={[activeMenuItem]}>
        {listToRender}
      </Menu>
    );
    return !isMobile ? (
      listToRender && (
        <Affix offsetTop={60} key="list" className="nav-list-wrapper">
          <div className="nav-list">
            {_title && _title.length > 0 ? <h2 key={`${pathKey}-title`}>{_title[0]['name']}</h2> : {}}
            {menu}
          </div>
        </Affix>
      )
    ) : (
      <MobileMenu>
        <div className="nav-list-wrapper">
          <div className="nav-list">
            {_title && _title.length > 0 ? <h2 key={`${pathKey}-title`}>{_title[0]['name']}</h2> : {}}
            {menu}
          </div>
        </div>
      </MobileMenu>
    );
  };

  getMenuItems(moduleData, pathNames) {
    if (!moduleData) {
      return null;
    }
    const menuData = getMenuItems(moduleData.filter(item => !item.meta.hidden));
    this.openKeys = [];
    return menuData.map(menuItem => {
      if (!menuItem.children) {
        return this.generateMenuItem(menuItem, pathNames, menuData.length);
      }
      this.openKeys.push(menuItem.title);
      return (
        <SubMenu title={<h4>{menuItem.title}</h4>} key={menuItem.title}>
          {menuItem.children.map(child => {
            if (child.type === 'type') {
              return (
                <ItemGroup title={child.title} key={child.title}>
                  {child.children
                    .sort((a, b) => a.title.charCodeAt(0) - b.title.charCodeAt(0))
                    .map(leaf => this.generateMenuItem(leaf, pathNames, menuData.length))}
                </ItemGroup>
              );
            }
            return this.generateMenuItem(child, pathNames, menuData.length);
          })}
        </SubMenu>
      );
    });
  }

  generateMenuItem = (meta, pathNames, length) => {
    const { themeConfig } = this.props;
    const source = themeConfig.source;
    const _link = meta.filename.replace(new RegExp(source), '');
    let link = _link.replace(/(\.md)/g, '');
    link = link.indexOf('/demo') > -1 ? link.replace(/(\/index)/g, '') : link;
    const key = fileNameToPath(meta.filename);
    let linkToChildren =
      link.split('/')[1] === pathNames[1] ? (
        <a>
          <span>{meta.chinese || meta.english}</span>
        </a>
      ) : (
        <Link to={link}>
          <span>{meta.chinese || meta.english}</span>
        </Link>
      );
    return (
      <Item key={key} disabled={meta.disabled}>
        {linkToChildren}
      </Item>
    );
  };

  cScrollClick = e => {
    e.preventDefault();
    scrollClick(e);
  };

  render() {
    const { className, location, data, children, isMobile } = this.props;
    const {
      props: {
        pageData: { meta, toc }
      }
    } = children;
    const pathNames = location.pathname && location.pathname.split('/');
    const pathKey = pathNames && pathNames.length > 0 && pathNames[0];
    const moduleData = this.getModuleData(data, pathNames);
    const listToRender = this.getListChildren(moduleData, pathNames, pathKey, isMobile);
    return (
      <div className={`${className}-wrapper`}>
        <TweenOneGroup
          enter={{
            y: 30,
            type: 'from',
            opacity: 0,
            onComplete: e => {
              const { target } = { ...e };
              target.style.cssText = '';
            }
          }}
          leave={{ y: -30, opacity: 0 }}
          className={className}
          component={Row}>
          <Col key="list" lg={4} md={5} sm={0} xs={0}>
            {listToRender}
          </Col>
          <Col lg={20} md={14} sm={24} xs={24} key="content" className={`${className}-content-wrapper`}>
            <TweenOneGroup
              enter={{ y: 30, type: 'from', opacity: 0 }}
              leave={{ y: -30, opacity: 0 }}
              className={`${className}-content`}
              style={{ minHeight: this.state.minHeight }}>
              <div key={pathKey}>{children}</div>
            </TweenOneGroup>
          </Col>
          <Col key="toc" offset={2} lg={2} md={3} sm={0} xs={0}>
            {!toc || toc.length <= 1 || meta.toc === false ? null : (
              <Affix offsetTop={16}>
                {this.props.utils.toReactComponent(['ul', { className: 'toc' }].concat(getChildren(toc)))}
              </Affix>
            )}
          </Col>
        </TweenOneGroup>
      </div>
    );
  }
}

export default Page;
