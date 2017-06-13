let redis = require('redis');
let redisClient = require('../../../bin/redis-client/redis-client');
let categoryService = require('../category-service');

let Q = require('q');

const chalk = require('chalk');

let self = module.exports = {
  initCache: function () {
    let deferred = Q.defer();
    categoryService.findAll((err, categories) => {
      if (err) deferred.reject(err);
      redisClient.hs
      redisClient.set('categories', JSON.stringify(categories));
      deferred.resolve();
    });
    return deferred.promise;
  }
}