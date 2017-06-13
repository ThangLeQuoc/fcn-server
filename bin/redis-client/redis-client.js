let redis = require('redis');
let config = require('config');


let port = config.get('database.redislabs.port');
let endpointURL = config.get('database.redislabs.endpoint');
let password = config.get('database.redislabs.password');

let client = redis.createClient(port, endpointURL, {
  no_ready_check: true
});

const chalk = require('chalk');

client.auth(password, function (err) {
  if (err) throw err;
});

client.on('connect', () => {
  console.log(chalk.blue('Established connection to RedisLab successfully'));
});



let self = module.exports = client