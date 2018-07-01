var path = require('path');
var webpack = require('webpack');

var root = require('app-root-path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'tbrtc.js'
    },
    node: {
        fs: 'empty'
    },
    devServer: { hot: true },
    module: {
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['env', 'stage-0'],
                }
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            ROOT_DIR: JSON.stringify(root+"/src/locale")
        })

    ]
};
