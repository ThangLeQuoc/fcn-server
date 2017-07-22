var gulp = require('gulp');
var handlebars = require('gulp-compile-handlebars');
var rename = require('gulp-rename');
var templateData = require('./articleBody.json');

gulp.task('makeEmail', function () {
    return gulp.src('body.handlebars')
        .pipe(handlebars(templateData))
        .pipe(rename('email.html'))
        .pipe(gulp.dest('views'));
});
