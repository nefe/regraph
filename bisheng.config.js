const path = require('path');
const CSSSplitWebpackPlugin = require('css-split-webpack-plugin').default;

function alertBabelConfig(rules) {
  rules.forEach(rule => {
    if (rule.loader && rule.loader === 'babel-loader') {
      rule.options.plugins = rule.options.plugins.filter(plugin => {
        return !plugin.indexOf || plugin.indexOf('babel-plugin-add-module-exports') === -1;
      });
      rule.options.plugins.push([
        'babel-plugin-transform-runtime',
        {
          polyfill: false,
          regenerator: false
        }
      ]);
      rule.options.plugins.push([
        'babel-plugin-import',
        {
          libraryName: 'antd',
          libraryDirectory: 'lib',
          style: true
        }
      ]);
    } else if (rule.use) {
      alertBabelConfig(rule.use);
    }
  });
}

module.exports = {
  root: '/regraph/',
  source: './docs',
  output: './_site',
  theme: './site',
  htmlTemplate: './site/static/template.html',
  devServerConfig: {},
  port: 4000,
  themeConfig: {
    home: '/regraph/',
    source: 'docs',
    title: 'ReGraph',
    repository: 'git@github.com:nefe/regraph.git',
    index: {
      banner: {
        title: 'ReGraph',
        introduce: 'ReGraph是面向关系型数据的可视化库，主要包括层级关系数据（树）和网状关系数据（图）',
        content: 'ReGraph分成三个部分，基础操作层(BaseGraph)、渲染交互层（ReScreen）以及布局算法层（BaseLayout）。',
        more: {
          label: '了解更多',
          link: '/examples/'
        },
        quickStart: {
          label: '快速开始',
          link: '/api/index'
        }
      }
    },
    header: {
      nav: [
        { name: '案例', href: '/examples/', key: 'examples' },
        { name: 'Demo', href: '/demo/reScreen', key: 'demo' },
        { name: 'API', href: '/api/index', key: 'api' }
      ]
    },
    footer: {
      copyright: 'DT-FE'
    }
  },
  doraConfig: {
    verbose: true
  },
  lessConfig: {
    javascriptEnabled: true
  },
  webpackConfig(config) {
    alertBabelConfig(config.module.rules);
    config.plugins.push(new CSSSplitWebpackPlugin({ size: 4000 }));
    config.resolve.alias = {
      'ReGraph': path.join(process.cwd(), './src'),
      'react-router': 'react-router/umd/ReactRouter'
    };
    return config;
  }
};
