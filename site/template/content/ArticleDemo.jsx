import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import Demo from '../components/Demo/Index';

class ArticleDemo extends React.PureComponent {
  static propTypes = {
    params: PropTypes.any
  };

  static defaultProps = {};

  componentDidMount() {
    const props = this.props;
    const { location } = props;
    this.hash = location.hash;
    if (window.addEventListener) {
      window.addEventListener('scroll', this.onScroll);
    } else {
      window.attachEvent('onscroll', this.onScroll);
    }
  }

  componentWillUnmount() {
    if (window.addEventListener) {
      window.removeEventListener('scroll', this.onScroll);
    } else {
      window.detachEvent('onscroll', this.onScroll);
    }
  }

  onScroll = () => {
    const tops = this.demoIds.map(item => {
      const dom = document.getElementById(item);
      let top = dom.getBoundingClientRect().top;
      if (top < 0) {
        top = -top;
      }
      return top;
    });
    const t = Math.min.apply(null, tops);
    const id = this.demoIds[tops.indexOf(t)];
    const link = `#${id}`;
    if (this.hash !== link) {
      /* eslint-disable no-restricted-globals */
      history.pushState(null, window.title, `#${id}`);
      /* eslint-enable no-restricted-globals */
      // cWindow.location.hash = `#${id}`;
      this.hash = link;
    }
  };

  render() {
    const props = this.props;
    const { pageData } = props;
    const demosToChild = Object.keys(pageData.demo)
      .map(key => pageData.demo[key])
      .filter(item => !item.meta.hidden)
      .sort((a, b) => a.meta.order - b.meta.order)
      .map((item, i) => {
        const content = props.utils.toReactComponent(['div'].concat(item.content));
        const comp = item.preview;
        return (
          <Demo.Item
            vertical={item.meta.vertical}
            title={item.meta.title}
            content={content}
            code={props.utils.toReactComponent(item.highlightedCode)}
            styleCode={item.highlightedStyle ? props.utils.toReactComponent(item.highlightedStyle) : null}
            mouseEnter={item.meta.mouseEnter}
            cStyle={item.style || null}
            key={i}
            id={item.meta.id}>
            {comp(React, ReactDOM)}
          </Demo.Item>
        );
      });
    const { meta, description } = pageData.index;
    const { title, subtitle, chinese, english } = meta;
    this.demoIds = demosToChild.map(item => item.props.id);
    return (
      <DocumentTitle title={`${subtitle || chinese || ''} ${title || english} - ReGraph`}>
        <article className="markdown">
          <h1>
            {title || english}
            <i>{subtitle || chinese}</i>
          </h1>
          {description ? props.utils.toReactComponent(description) : null}
          <Demo vertical={meta.vertical}>{demosToChild}</Demo>
        </article>
      </DocumentTitle>
    );
  }
}

export default ArticleDemo;
