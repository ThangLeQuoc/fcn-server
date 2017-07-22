let config = require('config');
let Q = require('q');
let helper = require('sendgrid').mail;
let apikey = config.get('sendgrid.apikey');
let sg = require('sendgrid')(apikey);

const chalk = require('chalk');




let fromEmail = new helper.Email('cuongnm265@gmail.com');
let toEmail = new helper.Email('trongnhanv63@gmail.com');
let subject = "If you see this, that mean we're great ";

let content = new helper.Content('text/plain', 'Steam summer is sale is near, bitch !');





let self = module.exports = {
  sendEmail: function () {
    let mail = new helper.Mail(fromEmail, subject, toEmail, content);


    let request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON()
    });

    sg.API(request, (err, response) => {
      if (err) {
        console.log(chalk.red(err));
      }
      console.log(chalk.green('Send success'));
      console.log(response.statusCode);
      console.log(response.body);
      console.log(response.headers);
    });
  }

}