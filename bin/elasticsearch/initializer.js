let esClient = require('./elastic-connection');
let config = require('config');
let Q = require('q');

let esIndex = config.get('elasticsearch.index');

const chalk = require('chalk');

let self = module.exports = {
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
        type: "article",
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

  indexingArticles: function(){


  }

}