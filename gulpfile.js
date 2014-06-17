var gulp = require('gulp');
var gutil = require('gulp-util');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var gulpImports = require('gulp-imports');
var nodemon = require('gulp-nodemon');
var rename = require('gulp-rename');
var path = require('path');
var markdown = require('gulp-markdown');

gulp.task('js', function(){

    return gulp.src([
        'src/FieldVal.js'
    ])
    .pipe(gulpImports())
    .pipe(concat('fieldval.js'))
    .pipe(gulp.dest('./'))
    .pipe(uglify())
    .pipe(concat('fieldval.min.js'))
    .pipe(gulp.dest('./'))
    .on('error', gutil.log);
})


gulp.task('default', function(){
    gulp.watch(['src/**/*.js'], ['js']);
    gulp.watch(['docs_src/**/*.md'], ['docs']);
});

gulp.task('docs', function() {
  gulp.src('./docs_src/**/*.md')
    .pipe(markdown())
    .pipe(gulp.dest('./docs/'))
});


gulp.task('nodemon', function () {
  nodemon({ script: 'mocha test/test.js', ext: 'js', ignore: ['src/'] })
    .on('restart', function () {
      console.log('restarted!')
    })
})