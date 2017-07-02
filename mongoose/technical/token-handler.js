const chalk = require('chalk');
let jwt = require('jsonwebtoken');
let Q = require('q');

let config = require('config');

let secret = config.get('jwt.secret');


let userService = require('../services/user-service');
let self = module.exports = {
  decodeToken(token) {
    let deferred = Q.defer();
    let decode = jwt.decode(token);
    if (self.checkTokenNotExpired(decode)) {
      userService.checkUserIsAdministrator(decode.sub).then((result) => {
        console.log(chalk.blue(result));
        deferred.resolve(result);
      });
    }
    else {
      deferred.resolve(false);
    }

    return deferred.promise;
  },

  checkTokenNotExpired(decodedPayload) {
    let date = new Date();
    let timeInSecond = date.getTime() / 1000;
    let expTime = decodedPayload.exp;
    if (expTime - timeInSecond >= 0)
      return true;
    return false;
  }
}