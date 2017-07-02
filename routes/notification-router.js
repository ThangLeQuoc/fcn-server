let express = require('express');
let router = express.Router();

let NotificationService = require('../mongoose/services/notification/notification-service');
let tokenHandler = require('../mongoose/technical/token-handler');
const chalk = require('chalk');


/** Notification Route: /notification */
router.route('/:notificationId')
    .put(function (req, res) {
        let notificationId = req.params.notificationId;
        let notification = req.body;
        NotificationService.update(notificationId, notification, function (err) {
            if (err) res.status(400).send();
            res.status(202).send();
        })
    });

router.route('/:notificationId/markAsRead')
    .put(function (req, res) {
        let notificationId = req.params.notificationId;
        NotificationService.markAsRead(notificationId, function (err) {
            if (err) res.status(400).send();
            res.status(202).send();
        })
    });

/** Get notification of user*/
router.route('/users/:userId')
    .get(function (req, res) {
        let token = req.body.token || req.query.token || req.headers['authorization'];
        if (!token)
            res.status(403).send();
        else {
            let recipient = req.params.userId;
            let result = tokenHandler.verifyUserIdentity(recipient, token);
            if (result) {
                NotificationService.findbyUser(recipient, function (err, docs) {
                    if (err) res.status(400).send(err);
                    res.status(200).send(docs);
                });
            } else res.status(403).send();
        }
    });

router.route('/users/:userId/seenAll')
    .post(function (req, res) {
        let token = req.body.token || req.query.token || req.headers['authorization'];
        if (!token) {
            res.status(403).send();
        } else {
            let userId = req.params.userId;
            let result = tokenHandler.verifyUserIdentity(userId, token);
            if (result) {
                NotificationService.seenAllNotificationByUser(userId, function (err) {
                    if (err) res.status(400).send(err);
                    res.status(202).send();
                });
            }
            else res.status(403).send();
        }
    });
    
router.route('/types')
    /*Get all notification types*/
    .get(function (req, res) {
        NotificationService.findAllType(function (err, docs) {
            if (err) res.status(400).send(err);
            res.status(200).send(docs);
        });
    })
    /**Post new notifcation type */
    .post(function (req, res) {
        let newType = req.body;
        NotificationService.saveType(newType, function (err) {
            if (err) res.status(400).send(err);
            res.status(201).send();
        })
    });


router.route('/pushNotification')
    .post(function (req, res) {
        let notification = req.body;
        NotificationService.pushNotification(notification).then(() => {
            res.status(202).send();
        }).catch((err) => {
            res.status(400).send();
        })
    });
module.exports = router;