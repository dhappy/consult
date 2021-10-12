const path = require('path')

module.exports = {
  entry: './src/index.jsx',
  devtool: 'eval-source-map',
  output: {
      filename: 'bundle.js',
      path: path.join(__dirname, 'public'),
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.jsx?$/,
        exclude: /node_modules/,
      },
      {
        loader: 'file-loader',
        test: /\.(png|jpe?g|gif|svgz?)$/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.jsx'],
  },
  mode: 'development',
}