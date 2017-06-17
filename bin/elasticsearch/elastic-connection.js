let elasticsearch = require('elasticsearch');
let config = require('config');

const chalk = require('chalk');


let esHostEndpoint = config.get('elasticsearch.bonsaiHostEndpoint');
let esIndex = config.get('elasticsearch.index');


let client = new elasticsearch.Client({
  'host': esHostEndpoint,
  log: 'info'
});



/**
 * Checking connection
 */
client.ping({
  requestTimeout: 2000
}, function (err) {
  if (err) console.log(chalk.red('ElasticSearch cluster is down ....'));
  else {
    console.log(chalk.green('ElasticSearch cluster connected successfully'));
  }
});



module.exports = client;