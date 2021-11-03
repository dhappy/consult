const webpack = require('webpack')
const path = require('path')
const json5 = require('json5')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const dotenv = (
  require('dotenv')
  .config({ path: `${__dirname}/.env` })
)
const dev = process.env.NODE_ENV !== 'production'

module.exports = {
  entry: './src/index.jsx',
  devtool: 'eval-source-map',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'build'),
    publicPath: 'auto',
    clean: true,
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
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(dotenv.parsed),
      'process.env.NODE_ENV': JSON.stringify(
        dev ? 'development' : 'production'
      ),
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  mode: 'development',
  devServer: {
    port: 3000,
    open: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.jsx'],
    fallback: {
      assert: require.resolve('assert'),
      buffer: require.resolve('buffer'),
      crypto: require.resolve('crypto-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
    },
  },
}