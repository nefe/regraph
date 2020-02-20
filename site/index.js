'use strict';
const Api = './template/content/api';
const Plugins = './template/content/plugins';
const Examples = './template/content/examples';
const Details = './template/components/Details';
const ArticleDemo = './template/content/ArticleDemo';
module.exports = {
  home: '/',
  plugins: [
    'bisheng-plugin-description',
    'bisheng-plugin-toc?maxDepth=2',
    'bisheng-plugin-react?lang=jsx harmony',
    'bisheng-plugin-antd'
  ],
  routes: {
    path: '/',
    component: './template/layout/index',
    indexRoute: {
      component: './template/main/index'
    },
    childRoutes: [
      {
        path: '/demo/:contentName',
        component: ArticleDemo
      },
      {
        path: '/api/:contentName',
        component: Api
      },
      {
        path: '/examples/',
        component: Examples
      }
    ]
  }
};
