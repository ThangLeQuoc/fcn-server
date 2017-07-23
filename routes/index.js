var express = require('express');
var router = express.Router();
var gulp = require('gulp');
require('../gulpfile');
var app = express();
var mailer = require('express-mailer');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.status(200).send('Mercury Mind is operating normally');
});

module.exports = router;
