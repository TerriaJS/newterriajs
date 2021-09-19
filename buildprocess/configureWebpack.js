var path = require('path');
var StringReplacePlugin = require("string-replace-webpack-plugin");
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
var webpack = require('webpack');

function configureWebpack(terriaJSBasePath, config, devMode, hot, MiniCssExtractPlugin, disableStyleLoader) {
    const cesiumDir = path.dirname(require.resolve('terriajs-cesium/package.json'));
    // const fontAwesomeDir = path.resolve(path.dirname(require.resolve('font-awesome/package.json')));
    // const reactMdeDir = path.resolve(path.dirname(require.resolve('react-mde/package.json')));
    // console.log(fontAwesomeDir);
    // console.log(reactMdeDir);

    config.node = config.node || {};

    // Resolve node module use of fs
    config.node.fs = 'empty';

    config.resolve = config.resolve || {};
    config.resolve.extensions = config.resolve.extensions || ['*', '.webpack.js', '.web.js', '.js', '.ts', '.tsx'];
    config.resolve.extensions.push('.jsx');
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.modules = config.resolve.modules || [];
    config.resolve.modules.push(path.resolve(terriaJSBasePath, 'wwwroot'));

    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    config.module.rules.push({
        test: /\.js?$/,
        include: path.dirname(require.resolve('terriajs-cesium')),
        exclude: [
            require.resolve('terriajs-cesium/Source/ThirdParty/zip'),
            require.resolve('terriajs-cesium/Source/Core/buildModuleUrl'),
            require.resolve('terriajs-cesium/Source/Core/TaskProcessor')
        ],
        loader: StringReplacePlugin.replace({
            replacements: [
                {
                    pattern: /buildModuleUrl\([\'|\"](.*)[\'|\"]\)/ig,
                    replacement: function (match, p1, offset, string) {
                        // The original string might have double quotes in it, so we'll replace them with single quotes
                        // That way, the quotes in "require" will hopefully always match
                        let p1_modified = p1.replace(/\"/g, '\'');
                        p1_modified = p1_modified.replace(/\\/g, '\\\\')
                        return "require('" + cesiumDir.replace(/\\/g, '\\\\') + "/Source/" + p1_modified + "')";
                    }
                },
                {
                    pattern: /Please assign <i>Cesium.Ion.defaultAccessToken<\/i>/g,
                    replacement: function() {
                        return "Please set \"cesiumIonAccessToken\" in config.json";
                    }
                },
                {
                    pattern: / before making any Cesium API calls/g,
                    replacement: function() {
                        return "";
                    }
                }
            ]
        })
    });

    // The sprintf module included by Cesium includes a license comment with a big
    // pile of links, some of which are apparently dodgy and cause Websense to flag
    // web workers that include the comment as malicious.  So here we munge URLs in
    // comments so broken security software doesn't consider them links that a user
    // might actually visit.
    config.module.rules.push({
        test: /\.js?$/,
        include: path.resolve(cesiumDir, 'Source', 'ThirdParty'),
        loader: StringReplacePlugin.replace({
            replacements: [
                {
                    pattern: /\/\*[\S\s]*?\*\//g, // find multi-line comments
                    replacement: function (match) {
                        // replace http:// and https:// with a spelling-out of it.
                        return match.replace(/(https?):\/\//g, '$1-colon-slashslash ');
                    }
                }
            ]
        })
    });
    // Use Babel to compile our JavaScript files.
    config.module.rules.push({
        test: /\.(ts|js)x?$/,
        include: [
            path.resolve(terriaJSBasePath, 'lib'),
            path.resolve(terriaJSBasePath, 'test'),
            path.resolve(terriaJSBasePath, 'buildprocess', 'generateDocs.ts')
        ],
        use: [
            {
                // Replace Babel's super.property getter with one that is MobX aware.
                loader: require.resolve('string-replace-loader'),
                options: {
                    search: 'function _get\\(target, property, receiver\\).*',
                    replace: 'var _get = require(\'' + path.resolve(terriaJSBasePath, 'lib').replace(/\\/g, "/") + '/Core/superGet\').default;',
                    flags: 'g'
                }
            },
            {
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    presets: [
                      [
                        '@babel/preset-env',
                        {
                          corejs: 3,
                          useBuiltIns: "usage"
                        }
                      ],
                      ['@babel/preset-react', {"runtime": "automatic"}],
                      ['@babel/typescript', {allowNamespaces: true}]
                    ],
                    plugins: [
                        'babel-plugin-jsx-control-statements',
                        '@babel/plugin-transform-modules-commonjs',
                        ["@babel/plugin-proposal-decorators", { "legacy": true }],
                        '@babel/proposal-class-properties',
                        '@babel/proposal-object-rest-spread',
                        'babel-plugin-styled-components',
                        require.resolve('@babel/plugin-syntax-dynamic-import'),
                        'babel-plugin-lodash'
                    ]
                }
            },
            // Re-enable this if we need to observe any differences in the
            // transpilation via ts-loader, & babel's stripping of types,
            // or if TypeScript has newer features that babel hasn't
            // caught up with
            // {
            //     loader: 'ts-loader',
            //     options: {
            //       transpileOnly: true
            //     }
            // }
        ]
    });

    // config.module.loaders.push({
    //     test: /\.(ts|js)$/,
    //     include: [
    //         path.resolve(terriaJSBasePath, 'lib'),
    //         path.resolve(terriaJSBasePath, 'test')
    //     ],
    //     loader: require.resolve('ts-loader')
    // });

    // Use the raw loader for our view HTML.  We don't use the html-loader because it
    // will doing things with images that we don't (currently) want.
    config.module.rules.push({
        test: /\.html$/,
        include: path.resolve(terriaJSBasePath, 'lib', 'Views'),
        loader: require.resolve('raw-loader')
    });

    // Allow XML in the models directory to be required-in as a raw text.
    config.module.rules.push({
        test: /\.xml$/,
        include: path.resolve(terriaJSBasePath, 'lib', 'Models'),
        loader: require.resolve('raw-loader')
    });

    config.module.rules.push({
        test: /\.json|\.xml$/,
        include: path.resolve(cesiumDir, 'Source', 'Assets'),
        loader: require.resolve('file-loader'),
        type: 'javascript/auto'
    });

    config.module.rules.push({
        test: /\.wasm$/,
        include: path.resolve(cesiumDir, 'Source', 'ThirdParty'),
        loader: require.resolve('file-loader'),
        type: 'javascript/auto'
    });

    config.module.rules.push({
        test: /\.js$/,
        include: path.resolve(path.dirname(require.resolve('terriajs-cesium/package.json')), 'Source'),
        loader: require.resolve('./removeCesiumDebugPragmas')
    });

    // Don't let Cesium's `buildModuleUrl` see require - only the AMD version is relevant.
    config.module.rules.push({
        test: require.resolve('terriajs-cesium/Source/Core/buildModuleUrl'),
        loader: 'imports-loader?require=>false'
    });

    // Don't let Cesium's `crunch.js` see require - only the AMD version is relevant.
    config.module.rules.push({
        test: require.resolve('terriajs-cesium/Source/ThirdParty/crunch'),
        loader: 'imports-loader?require=>false'
    });

    config.module.rules.push({
        test: /\.(png|jpg|svg|gif)$/,
        include: [
            path.resolve(terriaJSBasePath),
            path.resolve(cesiumDir)
        ],
        exclude: [
            path.resolve(terriaJSBasePath, 'wwwroot', 'images', 'icons'),
            path.resolve(terriaJSBasePath, 'wwwroot', 'fonts')
        ],
        loader: require.resolve('url-loader'),
        options: {
            limit: 8192
        }
    });

    config.module.rules.push({
        test: /\.woff(2)?(\?.+)?$/,
        include: path.resolve(terriaJSBasePath, 'wwwroot', 'fonts'),
        loader: require.resolve('url-loader'),
        options: {
            limit: 10000,
            mimetype: 'application/font-woff'
        }
    });

    config.module.rules.push({
        test: /\.(ttf|eot|svg)(\?.+)?$/,
        include: path.resolve(terriaJSBasePath, 'wwwroot', 'fonts'),
        loader: require.resolve('file-loader')
    });

    // config.module.loaders.push({
    //     test: /\.(ttf|eot|svg)(\?.+)?$/,
    //     include: path.resolve(fontAwesomeDir, 'fonts'),
    //     loader: require.resolve('file-loader')
    // });

    config.module.rules.push({
        test: /\.svg$/,
        include: path.resolve(terriaJSBasePath, 'wwwroot', 'images', 'icons'),
        loader: require.resolve('svg-sprite-loader'),
        options: {
            esModule: false
        }
    });

    config.devServer = config.devServer || {
        stats: 'minimal',
        port: 3003,
        open: true,
        contentBase: 'wwwroot/',
        proxy: {
            '*': {
                target: 'http://localhost:3001',
                bypass: function (req, res, proxyOptions) {
                    if (req.url.indexOf('/proxy') < 0 &&
                        req.url.indexOf('/proj4lookup') < 0 &&
                        req.url.indexOf('/convert') < 0 &&
                        req.url.indexOf('/proxyabledomains') < 0 &&
                        req.url.indexOf('/errorpage') < 0 &&
                        req.url.indexOf('/init') < 0 &&
                        req.url.indexOf('/serverconfig') < 0) {
                        return req.originalUrl;
                    }
                }
            }
        },
    };

    config.plugins = (config.plugins || []).concat([
        new StringReplacePlugin(),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ]);

    // Fork type checking to a separate thread
    config.plugins.push(
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: path.resolve(__dirname, '..', 'tsconfig.json'),
                diagnosticOptions: {
                    semantic: true,
                    syntactic: true,
                },
            },
        })
    );
    config.plugins.push(
        new ForkTsCheckerNotifierWebpackPlugin({
            excludeWarnings: true,
            // probably don't need to know first check worked as well - disable it
            skipFirstNotification: true
        })
    );

    if (hot && !disableStyleLoader) {
        config.module.rules.push({
            include: path.resolve(terriaJSBasePath),
            test: /\.scss$/,
            use: [
                require.resolve('style-loader'),
                {
                    loader: require.resolve('css-loader'),
                    options: {
                        sourceMap: true,
                        modules: true,
                        camelCase: true,
                        localIdentName: 'tjs-[name]__[local]',
                        importLoaders: 2
                    }
                },
                'resolve-url-loader?sourceMap',
                'sass-loader?sourceMap'
            ]
        });
    } else if (MiniCssExtractPlugin) {
        config.module.rules.push({
            exclude: [
                path.resolve(terriaJSBasePath, 'lib', 'Sass', 'common'),
                path.resolve(terriaJSBasePath, 'lib', 'Sass', 'global'),
            ],
            include: path.resolve(terriaJSBasePath, 'lib'),
            test: /\.scss$/,
            use: [
                MiniCssExtractPlugin.loader,
                'css-modules-typescript-loader',
                {
                    loader: require.resolve('css-loader'),
                    options: {
                        sourceMap: true,
                        modules: true,
                        camelCase: true,
                        localIdentName: 'tjs-[name]__[local]',
                        importLoaders: 2
                    }
                },
                'resolve-url-loader?sourceMap',
                'sass-loader?sourceMap'
            ]
        });

        // config.module.loaders.push({
        //     include: [path.resolve(fontAwesomeDir, 'css'), path.resolve(reactMdeDir, 'lib', 'styles', 'css')],
        //     test: /\.css$/,
        //     loaders: ['style-loader', 'css-loader']
        // });

        // config.module.loaders.push({
        //     include: path.resolve(fontAwesomeDir, 'fonts'),
        //     test: /\.woff2?/,
        //     loader: require.resolve('file-loader')
        // });
    }

    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Make a terriajs-variables alias so it's really easy to override our sass variables by aliasing over the top of this.
    config.resolve.alias['terriajs-variables'] = config.resolve.alias['terriajs-variables'] || require.resolve('../lib/Sass/common/_variables.scss');
    config.resolve.alias['terriajs-mixins'] = config.resolve.alias['terriajs-mixins'] || require.resolve('../lib/Sass/common/_mixins.scss');

    // Alias react and react-dom to the one used by the building folder - apparently we can rely on the dir always being
    // called node_modules https://github.com/npm/npm/issues/2734
    config.resolve.alias['react'] = path.dirname(require.resolve('react'));
    config.resolve.alias['react-dom'] = path.dirname(require.resolve('react-dom'));

    // Alias all lodash imports (including from our dependencies) to lodash-es
    config.resolve.alias['lodash'] = 'lodash-es';

    return config;
}

module.exports = configureWebpack;
