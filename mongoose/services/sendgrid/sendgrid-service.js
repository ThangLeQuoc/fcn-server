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
      deferred.resolve(response.body.recipients);
    });
    return deferred.promise;
  },

  getRecipientIdByEmail: function (email) {
    let deferred = Q.defer();
    let recipientId = undefined;
    self.getRecipients().then((recipients) => {
      recipients.map(recipient => {
        if (recipient.email === email)
          deferred.resolve(recipient.id);
      });
    }).catch(err => {
      deferred.reject(err);
    });
    return deferred.promise;
  },

  createList: function (listname) {
    let deferred = Q.defer();
    let request = sg.emptyRequest();
    let name = listname.toLowerCase().replace(/\s/g, "");
    request.body = {
      "name": name
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
      deferred.resolve(response.body.lists);
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
  },


  createListWithRecipients: function (listName, users) {
    let deferred = Q.defer();
    let recipientsId = [];
    let listId = undefined;
    self.createList(listName).then((list) => {
        listId = list.id;
        return Q.Promise((resolve, reject) => {
          self.getRecipients().then(recipientRecords => {
            users.map(user => {
              for (let record of recipientRecords) {
                if (record.email === user.email && recipientsId.indexOf(record.id) < 0) {
                  recipientsId.push(record.id);
                }
              }
            });
            resolve(recipientsId);
          });
        });
      })
      .then((recipientIdList) => {
        console.log(chalk.yellow(recipientIdList));
        self.addRecipientsToList(listId, recipientIdList).then((response) => {
          deferred.resolve(response);
        });
      }).catch((err) => {
        deferred.reject(err);
      });
    return deferred.promise;
  },

  addRecipientsToList: function (listId, recipients) {
    let deferred = Q.defer();
    let request = sg.emptyRequest();
    request.body = recipients;
    request.method = 'POST';
    request.path = listsRequestPath + '/' + listId + '/recipients';
    sg.API(request, (err, response) => {
      if (err) deferred.reject(err);
      deferred.resolve(response.body);
    });
    return deferred.promise;
  }
}