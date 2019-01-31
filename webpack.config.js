var path = require('path');
var webpack = require('webpack');

const root = require('app-root-path');

module.exports = {
    resolve: {
        symlinks: true,
    },
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'tbrtc.js',
    },
    node: {
        fs: 'empty',
    },
    devServer: {hot: true},
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
    plugins: [
        new webpack.DefinePlugin({
            __LOCALE_DIR__: JSON.stringify(`${root}/src/locale`),
            __VERSION__: JSON.stringify('1.0.0'),
        })

    ]
};
