const path = require('path')
const json5 = require('json5')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/index.jsx',
  devtool: 'eval-source-map',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'build'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.jsx?$/,
        exclude: /node_modules/,
      },
      {
        type: 'asset/resource',
        test: /\.(png|jpe?g|gif|svgz?)$/,
      },
      {
        type: 'json',
        test: /\.json5$/i,
        parser: { parse: json5.parse },
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin()],
  mode: 'development',
  watch: true,
}