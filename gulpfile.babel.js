'use strict';

import gulp from 'gulp';
import babel from 'gulp-babel'; // to distribute the npm module
import watch from 'gulp-watch'; // gulp.watch doesn't detect new files
import merge from 'merge-stream'; // handle multiple gulp.src in one task
import jsoneditor from 'gulp-json-editor'; // edit json in stream
import del from 'del'; // delete files
import runSequence from 'run-sequence';
import notifier from 'node-notifier';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream'; // helper for browserify text stream to gulp pipeline
import buffer from 'vinyl-buffer'; // helper for browserify

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

gulp.task('npm-dist:clean', function (done) {
  del(['./dist/**/*']).then(function () {
    done();
  });
});

gulp.task('npm-dist', ['npm-dist:clean', 'es6-7'], function () {
  let js = gulp.src(['./index.js', './{bin,lib}/**/*.js'], { base: './' })
    .pipe(babel())
    .pipe(gulp.dest('./dist'));

  let publ = gulp.src(['./public/**/*', '!./public/js{,/**/*}'], { base: './' })
    .pipe(gulp.dest('./dist'));

  let clientjs = gulp.src('./public/js/{bundle.min.js,bundle.min.js.map}', { base: './' })
    .pipe(gulp.dest('./dist'));

  let misc = gulp.src('./misc/**/*', { base: './' })
    .pipe(gulp.dest('./dist'));

  let root = gulp.src(['./README.md', './LICENSE'])
    .pipe(gulp.dest('./dist'));

  let pkg = gulp.src('./package.json')
    .pipe(jsoneditor(function (json) {
      delete json.scripts;
      delete json.devDependencies;
      delete json.semistandard;
      return json;
    }))
    .pipe(gulp.dest('./dist'));

  return merge(js, publ, clientjs, misc, root, pkg);
});
