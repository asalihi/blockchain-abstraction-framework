const path = require('path');
const NodeExternals = require('webpack-node-externals');
const TSConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = env => {
    return {
        entry: {
            'index': './src/index.ts',
            'index.min': './src/index.ts'
        },
        target: 'node',
        output: {
            path: path.resolve(__dirname, 'bundles'),
            filename: '[name].js',
            library: {
                name: 'Core',
                type: 'umd',
                umdNamedDefine: true
            },
            globalObject: 'this'
        },
        resolve: {
            extensions: ['.ts', '.js'],
            plugins: [new TSConfigPathsPlugin()]
        },
        devtool: 'source-map',
        optimization: {
            minimize: true,
            minimizer: [new TerserPlugin({ include: /\.min\.js$/ })],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin()
        ],
        externals: [NodeExternals()]
    }
};