let config = require('config');
let Q = require('q');
let helper = require('sendgrid').mail;
let apikey = config.get('sendgrid.apikey');
let sg = require('sendgrid')(apikey);

const chalk = require('chalk');

let recipientRequestPath = config.get('sendgrid.requestPath.recipients');


let self = module.exports = {

  /**
   * Add new recipient
   */
  addRecipient: function (user) {
    let deferred = Q.defer();
    let request = sg.emptyRequest();
    request.path = recipientRequestPath;
    request.body = [{
      "email": user.email,
      "first_name": user.user_metadata.first_name,
      "last_name": user.user_metadata.last_name
    }];
    request.method = 'POST';

    sg.API(request, (err, response) => {
      if (err) deferred.reject(err);
      deferred.resolve(response.body);
    });
    return deferred.promise;
  },

  /**
   * Get list of recipient
   */
  getRecipients: function () {
    let deferred = Q.defer();
    let request = sg.emptyRequest();
    //request.queryParams["page"] = '1';
    //request.queryParams["page_size"] = '1';
    request.method = 'GET';
    request.path = recipientRequestPath;

    sg.API(request, (err, response) => {
      if (err) deferred.reject(err);
      deferred.resolve(response.body);
    });
    return deferred.promise;
  }


}