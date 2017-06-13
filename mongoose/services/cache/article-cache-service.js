let redis = require('redis');
let redisClient = require('../../../bin/redis-client/redis-client');
let articleService = require('../article-service');

let Q = require('q');

const chalk = require('chalk');

let self = module.exports = {
  initCache: function () {
    let deferred = Q.defer();
    articleService.findAllTrendingArticles().then((trendingArticles) => {
      redisClient.set('trendingArticles', JSON.stringify(trendingArticles));
    }).then(() => {
      articleService.findAllLatestArticles().then((latestArticles) => {
        redisClient.set('latestArticles', JSON.stringify(latestArticles));
      }).then(() => {
        articleService.findAllPromise().then((articles) => {
          redisClient.set('articles', JSON.stringify(articles));
        }).then(() => {
          deferred.resolve();
        })
      })
    }).catch((err) => {
      deferred.reject(err);
    })
    return deferred.promise;
  }
}