let elasticsearch = require('elasticsearch');
let config = require('config');

const chalk = require('chalk');
let esClient = require('./elastic-connection');

let index = config.get('elasticsearch.index');


let self = module.exports = {
  


}
