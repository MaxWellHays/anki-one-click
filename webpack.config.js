const { CheckerPlugin } = require('awesome-typescript-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { optimize } = require('webpack');
const path = require('path');
const { FileLoaderPlugin } = require('file-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const VersionFilePlugin = require('webpack-version-file-plugin');

let prodPlugins = [];

if (process.env.NODE_ENV === 'production') {
    prodPlugins.push(
        new optimize.AggressiveMergingPlugin(),
        new optimize.OccurrenceOrderPlugin()
    );
}

module.exports = {
    mode: process.env.NODE_ENV,
    devtool: 'inline-source-map',
    entry: {
        contentscript: path.join(__dirname, 'src/contentscript/contentscript.tsx'),
        background: path.join(__dirname, 'src/background/background.ts'),
        options: path.join(__dirname, 'src/options/options.tsx'),
        popup: path.join(__dirname, 'src/popup/popup.tsx'),
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.ts(x?)$/,
                use: 'awesome-typescript-loader?{configFileName: "tsconfig.json"}',
            },
            {
                test: /\.scss$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            },
            {
                test: /\.html/,
                loader: 'file-loader?name=[name].[ext]',
            },
        ],
    },
    plugins: [
        new CheckerPlugin(),
        ...prodPlugins,
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new VersionFilePlugin({
            packageFile: path.resolve(__dirname, 'package.json'),
            template: path.resolve(__dirname, 'src/manifest.json'),
            outputFile: path.resolve(__dirname, 'dist/manifest.json'),
        })
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
};
