const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const puppeteer = require('puppeteer');
const axios = require(`axios`);

const dotenv = require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const BUILD_DIR = path.resolve(__dirname, "fe_build");
const APP_DIR = path.resolve(__dirname, "src");

const ifDefLoaderOptions = {
    IS_PRODUCTION: false,
    IS_DEVELOPMENT: true
};

const config = {
    entry: APP_DIR + '/App.tsx',
    output: {
        path: BUILD_DIR,
        filename: '[name].dev.bundle.js'
    },
    devtool: "source-map",
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
                NODE_ENV: JSON.stringify('develop')
            },
            PRODUCTION: JSON.stringify(false),
            DIRECTLINE_SECRET: JSON.stringify(dotenv.parsed.PROD_PWD),
            DIRECTLINE_BOT_ID: JSON.stringify(dotenv.parsed.PROD_ID),
            DIRECTLINE_NAME: JSON.stringify('TOBi'),
            JSENCRYPT_URL: JSON.stringify("/static/jsencrypt.js"),
            LOGIN_BASE_URL: JSON.stringify("/ssoapi/")
        }),
        new HtmlWebPackPlugin({
            title: "index copied from html page from web chat",
            inject: true,
            template: 'index.html'
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false
        }),
        new MiniCssExtractPlugin({
            filename: "[name].dev.css",
            chunkFilename: "[id].css"
        }),
        new webpack.HotModuleReplacementPlugin({})

    ],
    devServer: {
        contentBase: BUILD_DIR,
        open: true,
        hot: true,
        before: function (app, server) {
            app.use(require(`cors`)());
            app.get('/get-token', async (request, response) => {
                console.log(`Request for a token arrived on webpack dev server`);
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.goto('https://tobi.vodafone.it');
                const windowTobi = await page.evaluate(() => JSON.stringify(window.tobi));
                await browser.close();
                response.json({
                    tobi: windowTobi
                })
            });
            app.get('/:type(img|fonts)/:resource', function (req, res) {
                res.sendFile(path.join(__dirname, `src`, `styles`, req.params.type, req.params.resource))
            });
            app.get('/static/jsencrypt.js', async function (req, res) {
                try {
                    const response = await axios.get("https://login.vodafone.it/resources/ssoapi/js/jsencrypt.js");
                    res.setHeader('Content-type', 'text/javascript');
                    res.charset = 'UTF-8';
                    res.send(response.data)
                } catch (error) {
                    console.log(error);
                    res.sendStatus(500);
                }
            });
        },
        proxy: {
            '/api': {
                target: 'https://tobi.vodafone.it',
                changeOrigin: true
            },
            '/ssoapi': {
                target: 'https://login.vodafone.it',
                changeOrigin: true
            },
            '/js': {
                target: 'https://tobi.vodafone.it',
                changeOrigin: true
            }
        }
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            automaticNameDelimiter: '.'
        }
    }
}

module.exports = config;