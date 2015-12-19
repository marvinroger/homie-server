'use strict';

let gulp = require('gulp');
let watch = require('gulp-watch'); // gulp.watch doesn't detect new files
let runSequence = require('run-sequence');
let notifier = require('node-notifier');
let sourcemaps = require('gulp-sourcemaps');
let uglify = require('gulp-uglify');
let browserify = require('browserify');
let babelify = require('babelify');
let source = require('vinyl-source-stream'); // helper for browserify text stream to gulp pipeline
let buffer = require('vinyl-buffer'); // helper for browserify

let errorHandler = function (task) {
  return function (error) {
    console.log(`Error in ${task}: ${error.message}`);
    notifier.notify({
      title: `Error in ${task}`,
      message: error.message
    });
  };
};

gulp.task('default', ['es6-7'], function (done) {
  watch('./public/**/!(bundle).js', function (vinyl) {
    console.log(`${vinyl.path} was '${vinyl.event}', running es6-7...`);
    runSequence('es6-7');
  });
});

gulp.task('es6-7', function () {
  return browserify('./public/js/app.js')
    .transform(babelify.configure({ presets: ['es2015', 'stage-3', 'react'] }))
    .bundle()
    .on('error', function (error) {
      errorHandler('es6-7')(error);
      this.emit('end');
    }) // Don't crash if failed, plumber alone doesn't work with browserify
    .pipe(source('bundle.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'));
});
