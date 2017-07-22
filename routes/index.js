var express = require('express');
var router = express.Router();
var gulp = require('gulp');
require('../gulpfile');
var app = express();
var mailer = require('express-mailer');
/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('index', {
  //   title: 'Frog-coffee-news Server'
  // });
  
  res.status(200).send();
});

module.exports = router;
