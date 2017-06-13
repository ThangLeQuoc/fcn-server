let redis = require('redis');
let redisClient = require('../../../bin/redis-client/redis-client');
let Q = require('q');

let categoryCacheService = require('./category-cache-service');

const chalk = require('chalk');

let self = module.exports = {
  initializeCache: function () {
    return Q.all([categoryCacheService.initCategoryCache()]);
  }
}