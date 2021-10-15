const path = require('path')
const json5 = require('json5')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './src/index.jsx',
  devtool: 'eval-source-map',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'build'),
    publicPath: 'auto',
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
  plugins: [
    new HtmlWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
      ],
    }),
  ],
  mode: 'development',
  devServer: {
    port: 3000,
    open: true,
  },
}