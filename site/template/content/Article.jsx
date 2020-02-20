import React from 'react';
import { getChildren } from 'jsonml.js/lib/utils';
import DocumentTitle from 'react-document-title';
import * as utils from '../utils';

class Article extends React.Component {
  static propTypes = {};

  static defaultProps = {};

  render() {
    const { pageData, themeConfig } = this.props;
    const { meta, content, toc, api } = pageData;
    const { title, subtitle, chinese, english, filename } = meta;
    const tocItem = this.props.utils.toReactComponent(toc);
    const tocChildren = utils.toArrayChildren(tocItem.props.children).map(item => {
      const itemChildren = utils.toArrayChildren(item.props.children).map(cItem =>
        React.cloneElement(cItem, {
          onClick: utils.scrollClick
        })
      );
      return React.cloneElement(item, item.props, itemChildren);
    });
    return (
      <DocumentTitle title={`${title || chinese || english} - ${themeConfig.title}`}>
        <article className="markdown">
          {!toc || toc.length <= 1 ? null : (
            <section className="toc">{React.cloneElement(tocItem, tocItem.props, tocChildren)}</section>
          )}
          {!content
            ? null
            : this.props.utils.toReactComponent(['section', { className: 'markdown' }].concat(getChildren(content)))}
          {api ? this.props.utils.toReactComponent(api) : null}
        </article>
      </DocumentTitle>
    );
  }
}

export default Article;
