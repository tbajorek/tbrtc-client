const webpack = require('webpack');

const root = require('app-root-path');

const config = {
  mode: 'development',
  target: 'node',
  plugins: [
    new webpack.DefinePlugin({
      __LOCALE_DIR__: JSON.stringify(`${root}/src/locale`),
      __VERSION__: JSON.stringify('1.0.0'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
        },
        include: [
          '/node_modules/tbrtc-common',
        ],
      },
    ],
  },
  node: {
    fs: 'empty',
  },
  externals: {
    canvas: "commonjs canvas" // Important (2)
  },
};

module.exports = config;
