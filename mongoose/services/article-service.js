/** Article  Service*/
let Article = require('../models/article-model');
let User = require('../models/user-model');
let ObjectId = require('mongoose').Types.ObjectId;
let DateService = require('../technical/current-date-service');
let categoryService = require('./category-service');
let discussionService = require('./discussion-service')
let userService = require('./user-service');
let tagService = require('./tag-service');

let mailerService = require('./express-mailer/mailer-service');
let esClient = require('./elasticsearch-client/elastic-client');

let Q = require('q');

const chalk = require('chalk');
let self = module.exports = {
    /**Find one document */
    findOne: function (documentId, callback) {
        if (ObjectId.isValid(documentId)) {
            Article.findById(documentId, function (err, doc) {
                if (err) return callback(err);
                return callback(null, doc);
            });
        }
    },

    /** Find documents with keyword in content */
    findByContent: function (keywords, callback) {
        Article.find({
            title: {
                $regex: keywords,
                $options: 'i'
            }
        }, function (err, docs) {
            if (err) throw err;
            else {
                return callback(null, docs);
            }
        });
    },

    /** Find all document */
    findAll: function (callback) {
        Article.find(function (err, docs) {
            if (err) return callback(err);
            return callback(null, docs);
        });

    },

    findAllPromise: function () {
        let defer = Q.defer();
        Article.find(function (err, docs) {
            if (err) defer.reject(err);
            defer.resolve(docs);
        });
        return defer.promise;
    },

    /** Find by category */
    findByCategory: function (category, callback) {
        let defer = Q.defer();
        let categoryId = category;
        /** if category paramater is not object ID ? - may be it's a name ? **/
        if (!ObjectId.isValid(category)) {
            categoryService.getIdByName(category).then(function (category) {
                    categoryId = category._id;
                }, function (err) {
                    return defer.reject(err);
                })
                .then(function (err) {
                    Article.find({
                        category: categoryId
                    }, function (err, docs) {
                        if (err) return callback(err);
                        return callback(null, docs);
                    })
                }, function (err) {
                    return callback(err);
                }).catch(function (err) {});
        } else {
            Article.find({
                category: categoryId
            }, function (err, docs) {
                if (err) return callback(err);
                if (docs[0] == null) return callback('Invalid Category');
                return callback(null, docs);
            })
        }
    },


    /** Find by creator */
    findByCreator: function (userId, callback) {
        if (ObjectId.isValid(userId)) {
            Article.find({
                created_by: userId
            }, function (err, docs) {
                if (err) throw err;
                else return callback(null, docs);
            });
        } else {
            return callback('Invalid ObjectId');
        }
    },

    findOnePromise: function (articleId) {
        let defer = Q.defer();
        Article.findById(articleId, function (err, doc) {
            if (err) defer.reject(err);
            defer.resolve(doc);
        });
        return defer.promise;
    },

    //
    initDiscussion: function (articleId) {
        let defer = Q.defer();
        discussionService.save(articleId, function (err) {
            if (err) {
                return defer.reject();
            }
            return defer.resolve();
        });
        return defer.promise;
    },


    /** Save new Article */
    save: function (document, callback) {
        let article = new Article(document);
        article.date = DateService.getCurrentDay();
        // let that = self;
        article.save(function (err, article) {
            if (err) return callback(err);
            else {
                userService.findTargetedUserInterestedInTags(article.tags).then((interestedUsers) => {
                    mailerService.createTemplateMail(article).then(() => {
                        mailerService.sendMailToTargetUsers(interestedUsers).then(() => {
                            
                        });
                    });
                });
                esClient.addArticleToIndex(article);
                self.initDiscussion(article._id).then(function () {
                    return callback(null, article._id);
                }, function (err) {
                    return callback(err);
                });
            }
        });
    },

    /**Update article */
    update: function (documentId, document) {
        let defer = Q.defer();
        if (ObjectId.isValid(documentId)) {
            if (document.tags) {
                self.findOnePromise(documentId).then((article) => {
                    let missingTags = article.tags;
                    for (let tag of document.tags) {
                        for (var index = 0; index < missingTags.length; index++) {
                            if (tag.tag_id == missingTags[index].tag_id) {
                                missingTags.splice(index, 1);
                            }
                            break;
                        }
                    }
                    return missingTags;
                }).then((missingTags) => {
                    if (missingTags.length == 0)
                        Q.resolve(null);
                    else {
                        let promises = missingTags.map(tag => {
                            return tagService.pullArticleFromTag(documentId, tag.tag_id).then(() => {
                                Q.resolve(null);
                            }).catch((err) => {
                                Q.reject(err);
                            });
                        });
                        return Q.all(promises);
                    }
                }).then(() => {
                    let tagsId = [];
                    for (let tag of document.tags) {
                        tagsId.push(tag.tag_id);
                    }
                    tagService.pushArticleToTags(documentId, tagsId).then(() => {
                        return Q.resolve(null);
                    })
                }).then(() => {
                    Article.findByIdAndUpdate(documentId, document, function (err, article) {
                        if (err) defer.reject(err);
                        esClient.addArticleToIndex(article);
                        defer.resolve(article);
                    });
                });
            }

        }
        return defer.promise;
    },

    /** Remove article */
    remove: function (documentId, callback) {
        if (ObjectId.isValid(documentId)) {
            self.findOnePromise(documentId).then((article) => {
                if (article.tags) {
                    tagService.pullArticleFromTags(documentId, article.tags);
                }
            }).catch((err) => {
                console.log(err);
                return callback(err);
            }).then(() => {
                Article.findByIdAndRemove(documentId, function (err) {
                    esClient.initializeES();
                    if (err) return callback(err);
                    else {
                        return callback(null);
                    }
                })
            });
        } else {
            return callback('Invalid ObjectId');
        }
    },



    /**
     * Increase number of view
     */
    increaseView: function (documentId) {
        let defer = Q.defer();
        Article.findByIdAndUpdate(documentId, {
            "$inc": {
                "visit_count": 1
            }
        }, function (err, doc) {
            if (err) defer.reject(err);
            defer.resolve(doc);
        });
        return defer.promise;
    },

    /**
     * Set comment_count
     * 
     */
    //TODO: This method is used only one time
    initCommentCount: function () {
        let defer = Q.defer();
        Article.update({}, {
            "$set": {
                "comment_count": 0
            }
        }, {
            multi: true
        }).exec(function (err, docs) {
            if (err) defer.reject(err);
            defer.resolve(docs);
        });
        return defer.promise;
    },

    /**
     * Increase & Decrease Comment Count on Article
     */
    increaseCommentCount: function (documentId) {
        let defer = Q.defer();
        Article.findByIdAndUpdate(documentId, {
            "$inc": {
                "comment_count": 1
            }
        }, function (err, doc) {
            if (err) defer.reject(err);
            defer.resolve(doc);
        })
        return defer.promise;
    },
    decreaseCommentCount: function (documentId) {
        let defer = Q.defer();
        Article.findByIdAndUpdate(documentId, {
            "$inc": {
                "comment_count": -1
            }
        }, function (err, doc) {
            if (err) defer.reject(err);
            defer.resolve(doc);
        })
        return defer.promise;
    },


    /**
     * Update score base on release date and view
     */
    updateScore: function (documentId) {
        let defer = Q.defer();
        self.findOnePromise(documentId).then((article) => {
            let distance_min = DateService.getMinutesSinceRelease(article.date);
            let score = article.visit_count / distance_min;
            Article.findByIdAndUpdate(documentId, {
                "$set": {
                    "score": score
                }
            }, function (err, doc) {
                if (err) defer.reject(err);
                defer.resolve(doc);
            })
        });
        return defer.promise;
    },


    findTrendingArticlesByCategory: function (category) {
        let defer = Q.defer();
        if (!ObjectId.isValid(category)) {
            categoryService.getIdByName(category).then((doc) => {
                categoryId = doc._id;
                Article.find({
                        category: categoryId
                    }).limit(10)
                    .sort({
                        score: -1
                    }).exec(function (err, docs) {
                        err ? defer.reject(err) : defer.resolve(docs);
                    });
            });
        } else {
            Article.find({
                    category: category
                }).limit(10)
                .sort({
                    score: -1
                }).exec(function (err, docs) {
                    err ? defer.reject(err) : defer.resolve(docs);
                });
        }

        return defer.promise;
    },

    findAllTrendingArticles: function () {
        let defer = Q.defer();
        Article.find({}).limit(20).sort({
            score: -1
        }).exec(function (err, docs) {
            err ? defer.reject(err) : defer.resolve(docs);
        });
        return defer.promise;
    },

    findLatestArticlesByCategory: function (category) {
        let defer = Q.defer();
        if (!ObjectId.isValid(category)) {
            categoryService.getIdByName(category).then((doc) => {
                categoryId = doc._id;
                Article.find({
                    category: categoryId
                }).limit(10).sort({
                    date: -1
                }).exec(function (err, docs) {
                    err ? defer.reject(err) : defer.resolve(docs);
                });
            })
        } else {
            Article.find({
                category: category
            }).limit(10).sort({
                date: -1
            }).exec(function (err, docs) {
                err ? defer.reject(err) : defer.resolve(docs);
            });
        }
        return defer.promise;
    },

    findAllLatestArticles: function () {
        let defer = Q.defer();
        Article.find({}).limit(20).sort({
            date: -1
        }).exec(function (err, docs) {
            err ? defer.reject(err) : defer.resolve(docs);
        });
        return defer.promise;
    },

    initScore: function (callback) {
        Article.update({}, {
            "$set": {
                "visit_count": 0,
                "score": 0
            }
        }, {
            "new": true,
            "multi": true
        }, function (err, docs) {
            if (err) return callback(err);
            return callback(null);
        });
    },

    getCategoryNameByArticleId: function (articleId) {
        let defer = Q.defer();
        self.findOnePromise(articleId).then((article) => {
            return article.category;
        }).then((category) => {
            categoryService.findOne(category, function (err, doc) {
                err ? defer.reject(err) : defer.resolve(doc.name.toLowerCase());
            });
        });
        return defer.promise;
    },



    serveFeaturedArticlesForUser: function (userId) {
        let defer = Q.defer();
        userService.findFavoriteTags(userId).then((tags) => {
            let promises = tags.map((tag) => {
                return tagService.listArticlesWithinDay(tag.tag_id, 2).then((articles) => {
                    return Q.resolve(articles);
                }).catch((err) => {
                    return Q.reject(err);
                });
            });

            Q.all(promises).then((articlesWithinTag) => {
                let targetArticles = [];
                articlesWithinTag.map((tag) => {
                    for (let article of tag.articles) {
                        if (self.arrayContainObject(article, targetArticles)) {
                            break;
                        } else {
                            targetArticles.push(article);
                        }
                    }
                });
                return targetArticles;
            }).then((targetArticles) => {
                let articlesStats = self.rateScoreOnArticleBaseOnUserPreferences(targetArticles, tags);
                let sortedArticlesWithScore = self.arrangeSuggestArticlesBaseOnScore(articlesStats);
                let sortedArticles = self.getArticlesWithoutRatedScore(sortedArticlesWithScore);
                defer.resolve(sortedArticles);
            });
        });
        return defer.promise;
    },


    rateScoreOnArticleBaseOnUserPreferences(articleList, userTagList) {
        let defer = Q.defer();
        let articleStats = [];
        articleList.map((article) => {
            let articleWithStat = article;
            let user_score = self.getScoreBaseOnTags(article.tags, userTagList);
            articleStats.push({
                article: articleWithStat,
                score: user_score
            });
        });
        return articleStats;
    },

    getScoreBaseOnTags(tags, userTagList) {
        let score = 0;
        tags.map((tag) => {
            for (let tagStats of userTagList) {
                if (tag.tag_id.toString() === tagStats.tag_id.toString()) {
                    score += tagStats.visit_time;
                    break;
                }
            }
        });
        return score;
    },

    getArticlesWithoutRatedScore(articleList) {
        let articles = [];
        articleList.map((stat) => {
            articles.push(stat.article);
        });
        return articles;
    },

    arrayContainObject(obj, list) {
        for (let index = 0; index < list.length; index++) {
            if (list[index]._id.toString() == obj._id.toString()) {
                return true;
            }
        }
        return false;
    },

    arrangeSuggestArticlesBaseOnScore(suggestedArticles) {
        suggestedArticles.sort((a, b) => {
            return b.score - a.score;
        });
        return suggestedArticles;
    },

    toggleBookmarkStatus(userId, articleId) {
        let deferred = Q.defer();
        userService.findOnePromise(userId).then((user) => {
            let bookmarks = user.bookmarks;
            userService.checkIfArticleExistInBookmarks(userId, articleId).then((result) => {
                if (result == true) {
                    userService.pullArticleFromBookmarks(userId, articleId).then((user) => {
                        deferred.resolve(user);
                    }).catch((err) => {
                        deferred.reject(err);
                    })

                } else {
                    userService.pushArticleToBookmarks(userId, articleId).then((user) => {
                        deferred.resolve(user);
                    }).catch((err) => {
                        deferred.reject(err);
                    });
                }
            });
        });
        return deferred.promise;
    },
    getArticlesInBookmarksOfUser(userId) {
        let deferred = Q.defer();
        User.findById(userId).populate('bookmarks').exec(function (err, user) {
            if (err) deferred.reject(err);
            deferred.resolve(user.bookmarks);
        });
        return deferred.promise;
    },

    indexArticles: function () {
        let deferred = Q.defer();
        self.findAllPromise().then((articles) => {
            let promises = articles.map((article) => {
                esClient.addArticleToIndex(article).then((result) => {
                    return Q.resolve(article);
                }).catch(err => {
                    return Q.reject(err);
                });
            });
            return Q.all(promises);
        }).then((articles) => {
            console.log(chalk.green('All articles has been indexed ! '));
            deferred.resolve(articles);
        }).catch(err => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

}