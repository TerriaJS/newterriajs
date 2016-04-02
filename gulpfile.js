'use strict';

/*global require*/

// Every module required-in here must be a `dependency` in package.json, not just a `devDependency`,
// so that our postinstall script (which runs `gulp post-npm-install`) is able to run without
// the devDependencies available.  Individual tasks, other than `npm-post-install` and any tasks it
// calls, may require in `devDependency` modules locally.
var gulp = require('gulp');

gulp.task('default', ['lint', 'build']);
gulp.task('build', ['build-specs', 'copy-cesium-assets']);
gulp.task('release', ['release-specs', 'copy-cesium-assets', 'make-schema']);
gulp.task('watch', ['watch-specs', 'copy-cesium-assets']);
gulp.task('post-npm-install', ['copy-cesium-assets']);

gulp.task('build-specs', function(done) {
    var webpackConfig = require('./buildprocess/webpack.config.js');

    runWebpack(webpackConfig, done);
});

gulp.task('release-specs', function(done) {
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js');

    runWebpack(Object.assign({}, webpackConfig, {
        plugins: [
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin()
        ].concat(webpackConfig.plugins || [])
    }), done);
});

gulp.task('watch-specs', function(done) {
    var notifier = require('node-notifier');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js');

    var wp = webpack(webpackConfig);
    wp.watch({}, function(err, stats) {
        if (stats) {
            console.log(stats.toString({
                colors: true,
                modules: false,
                chunkModules: false
            }));

            var jsonStats = stats.toJson();
            if (err || (jsonStats.errors && jsonStats.errors.length > 0)) {
                notifier.notify({
                    title: 'Error building TerriaJS specs',
                    message: stats.toString({
                        colors: false,
                        hash: false,
                        version: false,
                        timings: false,
                        assets: false,
                        chunks: false,
                        chunkModules: false,
                        modules: false,
                        children: false,
                        cached: false,
                        reasons: false,
                        source: false,
                        errorDetails: true,
                        chunkOrigins: false
                    })
                });
            }
        }
    });
});

gulp.task('make-schema', function() {
    var genSchema = require('generate-terriajs-schema');

    return genSchema({
        source: '.',
        dest: 'wwwroot/schema',
        noversionsubdir: true,
        quiet: true
    });
});

gulp.task('lint', function() {
    var child_exec = require('child_process').execSync;
    var gutil = require('gulp-util');

    var eslintPath = require.resolve('eslint/bin/eslint.js');

    try {
        child_exec('node "' + eslintPath + '" lib --ignore-pattern lib/ThirdParty --max-warnings 0', {
            cwd: __dirname,
            stdio: 'inherit'
        });
    } catch(e) {
        throw new gutil.PluginError('eslint', 'eslint exited with an error.', { showStack: false});
    }
});

// Create a single .js file with all of TerriaJS + Cesium!
gulp.task('build-libs', function(done) {
    var fs = require('fs');
    var glob = require('glob-all');
    var path = require('path');
    var webpackConfig = require('./buildprocess/webpack.lib.config.js');

    // Build an index.js to export all of the modules.
    var index = '';

    index += '\'use strict\'\n';
    index += '\n';
    index += '/*global require*/\n';
    index += '\n';
    index += 'module.exports = {};\n';
    index += 'module.exports.Cesium = require(\'terriajs-cesium/Source/Cesium\');\n';

    var modules = glob.sync([
            './lib/**/*.js',
            './lib/**/*.ts',
            '!./lib/CopyrightModule.js',
            '!./lib/cesiumWorkerBootstrapper.js',
            '!./lib/ThirdParty/**',
            '!./lib/SvgPaths/**'
    ]);

    var directories = {};

    modules.forEach(function(filename) {
        var module = filename.substring(0, filename.length - path.extname(filename).length);
        var moduleName = path.relative('./lib', module);
        moduleName = moduleName.replace(path.sep, '/');
        var moduleParts = moduleName.split('/');

        for (var i = 0; i < moduleParts.length - 1; ++i) {
            var propertyName = moduleParts.slice(0, i + 1).join('.');
            if (!directories[propertyName]) {
                directories[propertyName] = true;
                index += 'module.exports.' + propertyName + ' = {};\n';
            }
        }

        index += 'module.exports.' + moduleParts.join('.') + ' = require(\'' + module + '\');\n';
    });

    fs.writeFileSync('terria.lib.js', index);

    runWebpack(webpackConfig, done);
});

gulp.task('docs', function(done) {
    var child_exec = require('child_process').exec;

    var jsdocPath = require.resolve('jsdoc/jsdoc.js');
    child_exec('node "' + jsdocPath + '" ./lib -c ./buildprocess/jsdoc.json', undefined, done);
});


gulp.task('copy-cesium-assets', function() {
    var path = require('path');

    var cesiumPackage = require.resolve('terriajs-cesium/package.json');
    var cesiumRoot = path.dirname(cesiumPackage);
    var cesiumWebRoot = path.join(cesiumRoot, 'wwwroot');

    return gulp.src([
        path.join(cesiumWebRoot, '**')
    ], {
        base: cesiumWebRoot
    }).pipe(gulp.dest('wwwroot/build/Cesium'));
});

gulp.task('test-browserstack', function(done) {
    runKarma('./buildprocess/karma-browserstack.conf.js', done);
});

gulp.task('test-saucelabs', function(done) {
    runKarma('./buildprocess/karma-saucelabs.conf.js', done);
});

gulp.task('test', function(done) {
    runKarma('./buildprocess/karma-local.conf.js', done);
});

function runWebpack(config, doneCallback) {
    var gutil = require("gulp-util");
    var webpack = require('webpack');

    var wp = webpack(config);
    wp.run(function(err, stats) {
        if (stats) {
            console.log(stats.toString({
                colors: true,
                modules: false,
                chunkModules: false
            }));

            if (!err) {
                var jsonStats = stats.toJson();
                if (jsonStats.errors && jsonStats.errors.length > 0) {
                    err = new gutil.PluginError('build-specs', 'Build has errors (see above).');
                }
            }
        }

        doneCallback(err);
    });
}

function runKarma(configFile, done) {
    var karma = require('karma').Server;
    var path = require('path');

    karma.start({
        configFile: path.join(__dirname, configFile)
    }, function(e) {
        return done(e);
    });
}
