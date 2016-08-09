const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  devServer: {
    host: 'localhost',
    port: 8081
  },
  entry: './src/js/main.jsx',
  output: {
    filename: './bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    loaders: [
      {
        test: /\.js?./,
        loader: 'babel-loader',
        include: path.join(__dirname, 'src', 'js'),
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.css/,
        include: path.join(__dirname, 'static', 'css'),
        loader: 'style-loader!css-loader'
      }
    ]
  },
  resolve: {
    moduleDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx', '.css']
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'static/index.html'
    })
  ]
};
