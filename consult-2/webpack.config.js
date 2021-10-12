const path = require('path')

module.exports = {
  entry: './src/index.jsx',
  output: {
      filename: 'bundle.js',
      path: path.join(__dirname, 'public'),
  },
  module: {
    rules: [{
      loader: 'babel-loader',
      test: /\.jsx?$/,
      exclude: /node_modules/,
    }],
  },
  resolve: {
    extensions: ['.ts', '.js', '.jsx'],
  },
  mode: 'development',
}