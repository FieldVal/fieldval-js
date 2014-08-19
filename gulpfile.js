var gulp = require('gulp');
var gutil = require('gulp-util');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var gulpImports = require('gulp-imports');
var nodemon = require('gulp-nodemon');
var path = require('path');

var mocha = require('gulp-mocha');
var jslint = require('gulp-jslint');

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
    .on('error', gutil.log);
})


gulp.task('test', function(){
    return gulp.src(['test/test.js'])
    .pipe(mocha());
});

gulp.task('jslint', function () {
    return gulp.src(['src/**/*.js'])
    .pipe(jslint({
        node: true,
        plusplus: true,
        vars: true,
        reporter: 'default',
        errorsOnly: false
    }))
    .on('error', function (error) {
        console.error(String(error));
    });
});

gulp.task('default', function(){
    gulp.start('js','test','jslint');
    gulp.watch(['src/**/*.js'], ['js','test','jslint']);
    gulp.watch(['test/**/*.js'], ['test']);
    gulp.watch(['docs_src/**/*'], ['docs']);
});

gulp.task('docs', function() {
    return gulp.src('./docs_src/*.json')
    .pipe(docs_to_json())
    .pipe(gulp.dest('./docs/'))
});