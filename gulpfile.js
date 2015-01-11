var gulp = require('gulp');
var gutil = require('gulp-util');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var gulpImports = require('gulp-imports');
var path = require('path');

var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');

var docs_to_json = require('sa-docs-to-json');

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
    .on('error', gutil.log)
    .on('end', function(){
        return gulp.start('test','jshint');
    })
})


gulp.task('test', function(cb){
    gulp.src(['./fieldval.js'])
    .pipe(istanbul())
    .on( 'finish', function () {
        gulp.src( ['test/test.js'] )
        .pipe( mocha( {
            reporter: 'spec'
        }))
        .on('error', gutil.log)
        .pipe(istanbul.writeReports())
        .on('end', cb);
    });
});

gulp.task('jshint', function () {
    return gulp.src(['src/**/*.js'])
    .pipe(jshint({
        // node: true
    }))
    .pipe(jshint.reporter('default'))
});

gulp.task('default', function(){
    gulp.start('js');
    gulp.watch(['src/**/*.js'], ['js']);
    gulp.watch(['test/**/*.js'], ['test']);
    gulp.watch(['docs_src/**/*'], ['docs']);
});

gulp.task('docs', function() {
    return gulp.src('./docs_src/*.json')
    .pipe(docs_to_json())
    .pipe(gulp.dest('./docs/'))
});