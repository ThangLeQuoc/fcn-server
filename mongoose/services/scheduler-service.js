let articleService = require('./article-service');

let Q = require('q');
const chalk = require('chalk');
let config = require('config');
let esClient = require('../services/elasticsearch-client/elastic-client');


let self = module.exports = {
  /**
   * Reupdate score for articles every 
   */
  recalculateArticlesScore() {
    let interval = config.get('articlesScoreUpdateInterval');

    setInterval(() => {
      articleService.findAllPromise().then((articles) => {
        articles.map((article) => {
          articleService.updateScore(article._id);
        })
      });
    }, interval);
  },

  reindexArticles() {
    let interval = config.get('articlesScoreUpdateInterval');
    setInterval(() => {
      esClient.flushAllIndices().then(() => {
        esClient.initializeES().then(() => {
          articleService.indexArticles();
        });
      })
    }, interval);

  }
}