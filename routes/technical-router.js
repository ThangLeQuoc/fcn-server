var express = require('express');
var router = express.Router();
const chalk = require('chalk');
let tokenHandler = require('../mongoose/technical/token-handler');
require('dotenv').config()

/* GET users listing. */
router.get('/keys/aws', function (req, res) {
  let token = req.body.token || req.query.token || req.headers['authorization'];
  if (!token) res.status(403).send();
  else {
    tokenHandler.verifyAdministratorToken(token).then((result) => {
      if (result) {
        let responseBody = {
          "aws_id": process.env.AWS_ID,
          "aws_secret": process.env.AWS_SECRET
        }
        res.status(200).send(responseBody);
      } else res.status(403).send();
    }).catch(err => {
      res.status(400).send(err);
    });
  }
});

module.exports = router;
