let esClient = require('./elastic-connection');
let config = require('config');


let Q = require('q');

let esIndex = config.get('elasticsearch.index');
let articleType = config.get('elasticsearch.article_type');

const chalk = require('chalk');

let self = module.exports = {

  /**
   * Generate Index Storage and Mapping
   */
  initializeES: function () {
    let deferred = Q.defer();
    /**
     * Init index 
     */
    esClient.indices.exists({
      index: esIndex
    }).then((result) => {
      console.log(chalk.blue('Index Mercury exist: ' + result));
      if (result === false) {
        esClient.indices.create({
          index: esIndex
        });
      }
    }).then(() => {
      esClient.indices.putMapping({
        index: esIndex,
        type: articleType,
        body: {
          "properties": {
            "title": {
              type: "string"
            },
            "description": {
              type: "string"
            },
            "content": {
              type: "string"
            },
            "tags": {
              properties: {
                "name": {
                  type: "string"
                }
              }
            },
            "suggest": {
              type: "completion",
              analyzer: "simple",
              search_analyzer: "simple"
            }
          }
        }
      }).then((result) => {
        deferred.resolve(result);
      });
    });
    return deferred.promise;
  },

  addArticleToIndex: function (article) {
    let deferred = Q.defer();

    esClient.index({
      index: esIndex,
      type: articleType,
      id: article._id.toString(),
      body: {
        "title": article.title,
        "description": article.description,
        "content": article.content,
        "tags": article.tags,
        "suggest": {
          "input": article.title.split(" ")
        }
      }
    }).then((result, err) => {
      if (err) {
        console.log(chalk.red(err));
        deferred.reject(err);
      }
      deferred.resolve(result);
    });
    return deferred.promise;
  },

  

  indexContainArticle: function (article) {
    let deferred = Q.defer();
    esClient.exists({
      id: article._id.toString(),
      index: esIndex,
      type: articleType
    }).then(result => {
      if (result) deferred.resolve(true);
      deferred.resolve(false);
    });
    return deferred.promise;
  },

  searchArticle: function (text) {
    let deferred = Q.defer();
    esClient.search({
      index: esIndex,
      type: articleType,
      body: {
        "query": {
          "match": {
            "_all": text
          }
        }
      }
    }).then((err, result) => {
      if(err) deferred.reject(err);
      deferred.resolve(result);
    });
    return deferred.promise;
  }
}