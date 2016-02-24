'use strict';

import path from 'path';
import gulp from 'gulp';
import plumber from 'gulp-plumber'; // help to avoid crash if error in a task
import newer from 'gulp-newer';
import babel from 'gulp-babel'; // to distribute the npm module
import watch from 'gulp-watch'; // gulp.watch doesn't detect new files
import merge from 'merge-stream'; // handle multiple gulp.src in one task
import jsoneditor from 'gulp-json-editor'; // edit json in stream
import del from 'del'; // delete files
import imagemin from 'gulp-imagemin';
import runSequence from 'run-sequence';
import notifier from 'node-notifier';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import browserify from 'browserify';
import envify from 'envify/custom';
import babelify from 'babelify';
import source from 'vinyl-source-stream'; // helper for browserify text stream to gulp pipeline
import buffer from 'vinyl-buffer'; // helper for browserify

let errored = false;
let errorHandler = function (task) {
  return function (error) {
    errored = true;
    console.log(`Error in ${task}: ${error.message}`);
    notifier.notify({
      title: `Error in ${task}`,
      message: error.message,
      icon: path.join(__dirname, 'gulp.png')
    });
  };
};

//  ################
//  # Entry points #
//  ################

gulp.task('dev', ['buildpublic:dev'], function (done) {
  watch('./app/assets/**/*', function (vinyl) {
    console.log(`${vinyl.path} was ${vinyl.event}, piping to public/...`);
    runSequence('assets');
  });

  watch('./app/vendor/**/*', function (vinyl) {
    console.log(`${vinyl.path} was ${vinyl.event}, piping to public/vendor/...`);
    runSequence('vendor');
  });

  watch('./app/js/**/*.js', function (vinyl) {
    console.log(`${vinyl.path} was '${vinyl.event}', running Babel...`);
    runSequence('es6-7:dev');
  });
});

gulp.task('dist', function (done) {
  runSequence(
    'dist:clear',
    ['dist:compileserver', 'dist:copyservermisc', 'dist:copyserverviews', 'dist:copypkg', 'buildpublic:dist'],
    'dist:copypublic',
  function () {
    if (errored) {
      console.log('Distribution failed, cleaning dist directory');
      runSequence('dist:clear', function () {
        process.exit(-1);
      });
    }
  });
});

//  ####################
//  # public directory #
//  ####################

gulp.task('buildpublic:dist', function (done) {
  runSequence(
    'buildpublic:clear',
    ['assets', 'vendor', 'es6-7:dist'],
    'buildpublic:imagemin',
  done);
});

gulp.task('buildpublic:dev', function (done) {
  runSequence(
    'buildpublic:clear',
    ['assets', 'vendor', 'es6-7:dev'],
  done);
});

gulp.task('buildpublic:clear', function (done) {
  del(['./public/**/*']).then(function () {
    done();
  });
});

gulp.task('buildpublic:imagemin', function () {
  return gulp.src('./public/img/**/*.{png,jpg,gif,svg}', {
    base: './public'
  })
    .pipe(plumber(errorHandler('buildpublic:imagemin')))
    .pipe(imagemin({
      progressive: true
    }))
    .pipe(gulp.dest('./public'));
});

// Babel

let es67 = () => {
  return browserify({ entries: './app/js/app.js', debug: true }) // debug for sourcemaps
    .transform(babelify, { presets: ['es2015', 'stage-3', 'react'], plugins: ['transform-decorators-legacy'] });
};

gulp.task('es6-7:dev', function () {
  return es67()
    .bundle()
    .on('error', function (error) {
      errorHandler('es6-7')(error);
      this.emit('end');
    }) // Don't crash if failed, plumber doesn't work with browserify
    .pipe(source('bundle.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('es6-7:dist', function () {
  return es67()
    .transform(envify({ NODE_ENV: 'production' }), { global: true }) // global: act on node_modules (here react prod mode)
    .bundle()
    .on('error', function (error) {
      errorHandler('es6-7')(error);
      this.emit('end');
    }) // Don't crash if failed, plumber doesn't work with browserify
    .pipe(source('bundle.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
});

// assets and vendor

gulp.task('assets', function () {
  return gulp.src('./app/assets/**/*', {
    base: './app/assets'
  })
    .pipe(plumber(errorHandler('assets')))
    .pipe(newer('./public'))
    .pipe(gulp.dest('./public'));
});

gulp.task('vendor', function () {
  return gulp.src('./app/vendor/**/*', {
    base: './app'
  })
    .pipe(plumber(errorHandler('vendor')))
    .pipe(newer('./public'))
    .pipe(gulp.dest('./public'));
});

//  ################
//  # Distribution #
//  ################

gulp.task('dist:clear', function (done) {
  del(['./dist/**/*']).then(function () {
    done();
  });
});

gulp.task('dist:compileserver', function () {
  return gulp.src(['./index.js', './{bin,lib}/**/*.js'], { base: './' })
    .pipe(babel({ 'plugins': ['transform-runtime'] }))
    .on('error', function (error) {
      errorHandler('dist:compileserver')(error);
      this.emit('end');
    })
    .pipe(gulp.dest('./dist'));
});

gulp.task('dist:copyservermisc', function () {
  return gulp.src('./misc/**/*', { base: './' })
    .pipe(plumber(errorHandler('dist:copyservermisc')))
    .pipe(gulp.dest('./dist'));
});

gulp.task('dist:copyserverviews', function () {
  return gulp.src('./views/**/*', { base: './' })
    .pipe(plumber(errorHandler('dist:copyservermisc')))
    .pipe(gulp.dest('./dist'));
});

gulp.task('dist:copypkg', function () {
  let txt = gulp.src(['./README.md', './LICENSE'])
    .pipe(plumber(errorHandler('dist:copypkg (txt)')))
    .pipe(gulp.dest('./dist'));

  let pkg = gulp.src('./package.json')
    .pipe(jsoneditor(function (json) {
      delete json.scripts;
      delete json.devDependencies;
      delete json.semistandard;
      return json;
    }))
    .pipe(plumber(errorHandler('dist:copypkg (pkg)')))
    .pipe(gulp.dest('./dist'));

  return merge(txt, pkg);
});

gulp.task('dist:copypublic', function () {
  return gulp.src(['./public/**/*'], { base: './' })
    .pipe(plumber(errorHandler('dist:copypublic')))
    .pipe(gulp.dest('./dist'));
});
