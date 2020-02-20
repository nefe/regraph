let path = require('path');
let webpack = require('webpack');
let fs = require('fs');

let sassLoader = [
  'style-loader',
  'css-loader',
  'sass-loader?sourceMap=true&sourceMapContents=true&includePaths[]=' +
  encodeURIComponent(path.resolve(__dirname, './src/styles')),
];

module.exports = {
  devtool: 'inline-source-map',
  mode: 'production',

  performance: {
    hints: false,
  },

  entry: {
    index: './src',
    vendors: ['react', 'react-dom'],
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
      ],
      loader: 'awesome-typescript-loader'
    }, {
      test: /\.scss$/,
      include: [
        path.resolve(__dirname, 'src'), 
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
