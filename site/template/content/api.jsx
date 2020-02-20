import React from 'react';
import { getChildren } from 'jsonml.js/lib/utils';
import DocumentTitle from 'react-document-title';

class Api extends React.Component {
  static propTypes = {};

  static defaultProps = {};

  render() {
    const { pageData, themeConfig } = this.props;
    const { meta, content, api } = pageData;
    const { title, subtitle, chinese, english, filename } = meta;
    return (
      <DocumentTitle title={`${title || chinese || english} - ${themeConfig.title}`}>
        <article className="markdown">
          {!content
            ? null
            : this.props.utils.toReactComponent(['section', { className: 'markdown' }].concat(getChildren(content)))}
          {api ? this.props.utils.toReactComponent(api) : null}
        </article>
      </DocumentTitle>
    );
  }
}

export default Api;
