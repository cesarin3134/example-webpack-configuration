const webpack = require('webpack');
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const autoprefixer = require("autoprefixer");

const dotenv = require('dotenv').config({
    path: path.resolve(__dirname, ".env")
});

const BUILD_DIR = path.resolve(__dirname, "fe_build");
const APP_DIR = path.resolve(__dirname, "src");
const ifDefLoaderOptions = {
    IS_PRODUCTION: true,
    IS_DEVELOPMENT: false
};

const config = {
    entry: APP_DIR + '/App.tsx',
    output: {
        path: BUILD_DIR,
        filename: '[name].prod.bundle.js'
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?|\.jsx?$/,
                exclude: /(node_modules|.\/src\/mocks)/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ["@babel/preset-env", "@babel/preset-react"]
                        }
                    }

                ]
            },
            {
                test: /\.tsx?|\.jsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: true,
                            experimentalWatchApi: true
                        },
                    },
                    {
                        loader: "ifdef-loader",
                        options: ifDefLoaderOptions
                    }
                ]
            },
            {
                test: /\.s?css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "postcss-loader"
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            implementation: require("node-sass")
                        }
                    }
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'fonts',
                        publicPath: 'fonts',
                    }
                }]
            },
            {
                test: /\.(jpe?g|png|gif|svg|ico)$/i,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'img',
                            publicPath: 'img',
                        }
                    }
                ]
            }

        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            },
            DIRECTLINE_SECRET: JSON.stringify(dotenv.parsed.PROD_PWD),
            DIRECTLINE_BOT_ID: JSON.stringify(dotenv.parsed.PROD_ID),
            DIRECTLINE_NAME: JSON.stringify('appName'),
            JSENCRYPT_URL: JSON.stringify("http://xxx"),
            LOGIN_BASE_URL: JSON.stringify("http://xxx")
        }),
        new HtmlWebPackPlugin({
            title: "index",
            inject: true,
            template: 'index.html'
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false
        }),
        new CompressionPlugin({
            test: /\.(js|css)$/,
        }),
        new MiniCssExtractPlugin({
            filename: "[name].prod.css",
            chunkFilename: "[id].css"
        }),
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: [
                    autoprefixer()
                ]
            }
        })

    ],
    devServer: {
        contentBase: BUILD_DIR,
        compress: true,
        open: true,
        proxy: {
            '/api': {
                target: 'https://xxx',
                changeOrigin: true
            },
            '/ssoapi': {
                target: 'https://xxx',
                changeOrigin: true
            },
            '/js': {
                target: 'https://xxx',
                changeOrigin: true
            }
        }
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            automaticNameDelimiter: '.'
        },
        minimizer: [
            new UglifyJSPlugin({}),
            new OptimizeCSSAssetsPlugin({})
        ]
    }

}

module.exports = config;