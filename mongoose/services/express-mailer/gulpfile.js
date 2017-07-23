var gulp = require('gulp');
var handlebars = require('gulp-compile-handlebars');
var rename = require('gulp-rename');
var templateData = require('./articleBody.json');
var Q = require('q');

gulp.task('makeEmail', function () {
    let deferred = Q.defer();
    gulp.src('body.handlebars')
        .pipe(handlebars(templateData))
        .pipe(rename('email.html'))
        .pipe(gulp.dest('mongoose/services/express-mailer/views')).on('end', () => {
            deferred.resolve();
        });
    return deferred.promise;



});