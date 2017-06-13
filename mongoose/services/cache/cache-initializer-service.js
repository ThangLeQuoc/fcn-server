let redis = require('redis');
let redisClient = require('../../../bin/redis-client/redis-client');
let Q = require('q');

let categoryCacheService = require('./category-cache-service');
let articleCacheService = require('./article-cache-service');
const chalk = require('chalk');

let self = module.exports = {
  initializeCaches: function () {
    return Q.all([categoryCacheService.initCache(),
      articleCacheService.initCache()
    ]);
  }
}