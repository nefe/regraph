var path = require('path');
var webpack = require('webpack');
var fs = require('fs');

var sassLoader = [
  'style-loader',
  'css-loader',
  'sass-loader?sourceMap=true&sourceMapContents=true&includePaths[]=' +
  encodeURIComponent(path.resolve(__dirname, './src/styles')),
];

module.exports = {
  devtool: 'inline-source-map',

  performance: {
    hints: false,
  },

  entry: {
    app: path.resolve(__dirname, './src')
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    publicPath: '/build/'
  },

  module: {
    rules: [{
      test: /\.tsx?$/,
      include: [
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, '../src'),
      ],
      loader: 'awesome-typescript-loader'
    }, {
      test: /\.scss$/,
      include: [
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, '../src'),
      ],
      use: sassLoader,
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader?sourceMap']
    }]
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.scss', '.css', '.less'],
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      filename: 'vendors.js',
    }),
    // 环境标志
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      __DEV__: true,
      __DEVTOOLS__: true,
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],

  devServer: {
    hot: true,
    compress: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    stats: {
      chunks: false,
    },
    host: "127.0.0.1",
    port: 8080
  },
};
