var express = require('express');
var app = express();
var cors = require('cors');


var path = require('path');
var fs = require('fs');
var cons = require('consolidate');
var mailer = require('express-mailer');
var gulp = require('gulp');

var handlebars = require('gulp-compile-handlebars');
var rename = require('gulp-rename');


// require('./gulpfile');

var Q = require('q');
var config = require('config');


const chalk = require('chalk');

let hostname = config.get('host');

// view engine setup
app.set('views', path.join(__filename, '/../views'));

app.engine('html', cons.swig);
app.set('view engine', 'html');
// app.set('view engine', 'jade');

app.use(cors());






mailer.extend(app, {
  from: 'no-reply@mercury-team.com',
  host: 'smtp.gmail.com', // hostname
  secureConnection: true, // use SSL
  port: 465, // port for secure SMTP
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: "mercurycrew64@gmail.com",
    pass: "mercurycrew6446"
  }
});





let self = module.exports = {
  createTemplateMail: function (article) {
    let deferred = Q.defer();
    let path = './articleBody.json';
    let template = {
      articles: []
    };

    template.articles.push({
      title: article.title,
      description: article.description,
      banner: article.header_image,
      link: self.generateArticleURL(article)
    });

    gulp.task('makeEmail', function () {
      gulp.src('body.handlebars')
        .pipe(handlebars(template))
        .pipe(rename('email.html'))
        .pipe(gulp.dest('mongoose/services/express-mailer/views')).on('end', () => {
          deferred.resolve();
        });
    });

    gulp.start('makeEmail');

    return deferred.promise;
  },

  sendMailToTargetUsers: function (mails) {
    let deferred = Q.defer()
    if (mails.length == 0) {
      deferred.reject("empty mails");
    } else {
      let concatMails = mails.join(",");


      app.mailer.send('email', {
        to: concatMails, // REQUIRED. This can be a comma delimited string just like a normal email to field.
        subject: 'Featured article for you', // REQUIRED.
        otherProperty: 'Other Property' // All additional properties are also passed to the template as local variables.
      }, function (err) {
        if (err) {
          console.log(err);
          deferred.reject(err);
        }
        deferred.resolve();
      });
    }
    return deferred.promise;
  },



  generateArticleURL: function (article) {
    let url = config.get("host") + '/news/' + article.category + '/' + article._id;
    return url;
  }

}