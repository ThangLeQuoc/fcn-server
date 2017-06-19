let config = require('config');
let Q = require('q');
let helper = require('sendgrid').mail;
let apikey = config.get('sendgrid.apikey');
let sg = require('sendgrid')(apikey);

const chalk = require('chalk');

let recipientsRequestPath = config.get('sendgrid.requestPath.recipients');
let listsRequestPath = config.get('sendgrid.requestPath.lists');


let self = module.exports = {

  /**
   * Add new recipient
   */
  addRecipient: function (user) {
    let deferred = Q.defer();
    let request = sg.emptyRequest();
    request.path = recipientsRequestPath;
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
   * Update recipient
   */
  updateRecipient: function (user) {
    let deferred = Q.defer();

    let request = sg.emptyRequest();
    request.path = recipientsRequestPath;
    request.body = [{
      "email": user.email,
      "first_name": user.user_metadata.first_name,
      "last_name": user.user_metadata.last_name
    }];
    request.method = 'PATCH';
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
    request.path = recipientsRequestPath;

    sg.API(request, (err, response) => {
      if (err) deferred.reject(err);
      deferred.resolve(response.body);
    });
    return deferred.promise;
  },

  createList: function (listname) {
    let deferred = Q.defer();
    let request = sg.emptyRequest();
    request.body = {
      "name": listname
    };

    request.method = 'POST';
    request.path = listsRequestPath;
    sg.API(request, (err, response) => {
      if (err) deferred.reject(err);
      deferred.resolve(response.body);
    });
    return deferred.promise;
  },

  getLists: function () {
    let deferred = Q.defer();
    let request = sg.emptyRequest();
    request.method = 'GET';
    request.path = listsRequestPath;
    sg.API(request, (err, response) => {
      if (err) deferred.reject(err);
      deferred.resolve(response.body);
    });
    return deferred.promise;
  },

  removeList: function (listId) {
    let deferred = Q.defer();
    let request = sg.emptyRequest();
    request.queryParams["delete_contacts"] = 'false';
    request.method = 'DELETE';
    request.path = listsRequestPath + '/' + listId;
    sg.API(request, (error, response) => {
      if (err) deferred.reject(err);
      deferred.resolve(response.body);
    })
    return deferred.promise;
  }
}