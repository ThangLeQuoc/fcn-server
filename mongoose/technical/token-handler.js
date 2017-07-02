const chalk = require('chalk');
let jwt = require('jsonwebtoken');
let Q = require('q');

let config = require('config');

let secret = config.get('jwt.secret');


let userService = require('../services/user-service');
let self = module.exports = {
  verifyAdministratorToken(token) {
    let deferred = Q.defer();
    if (token) {
      let decode = jwt.decode(token);
      if (self.checkTokenNotExpired(decode)) {
        let userId = self.getUserIdFromAuth0Token(decode);
        userService.checkUserIsAdministrator(userId).then((result) => {
          deferred.resolve(result);
        });
      } else {
        deferred.resolve(false);
      }
    } else {
      deferred.resolve(false);
    }

    return deferred.promise;
  },

  verifyUserIdentity(userId, token) {
    let decode = jwt.decode(token);
    let targetUserId = self.getUserIdFromAuth0Token(decode);
    if (targetUserId === userId)
      return true;
    return false;
  },

  checkTokenNotExpired(decodedPayload) {
    let date = new Date();
    let timeInSecond = date.getTime() / 1000;
    if (!decodedPayload)
      return false;
    let expTime = decodedPayload.exp;
    if (expTime - timeInSecond >= 0)
      return true;
    return false;
  },

  getUserIdFromAuth0Token(decodedPayload) {
    return decodedPayload.sub.slice(6, 30);
  }
}