let elasticsearch = require('elasticsearch');
let config = require('config');

const chalk = require('chalk');


let esHostEndpoint = config.get('elasticsearch.endpoint');
let client = new elasticsearch.Client({
  'host': esHostEndpoint,
  log: 'trace'
});

client.ping({
  requestTimeout: 1000
}, function(err){
  if(err) console.log(chalk.red('ElasticSearch cluster is down ....'));
  else {
    console.log(chalk.green('ElasticSearch cluster connected successfully'));
  }
});

module.exports = client;  