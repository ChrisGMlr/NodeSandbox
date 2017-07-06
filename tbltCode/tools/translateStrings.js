// Make automated translations of the strings file.

var Mustache = require('mustache');
var fs = require('fs');
var google = require('googleapis');
var translate = google.translate('v2');
var async = require('async');

var languages = ['zh', 'fr', 'es'];
var key = 'AIzaSyBholyY68hfBze9J5siZSy4KMdgXgnC4as';

var stringsFile = '../app/content/strings.json';
var stringsData = JSON.parse(fs.readFileSync(stringsFile).toString());

async.series([

    // Translate POI categories
    function(callback) {
        languages.forEach(function(language) {
            stringsData.uistrings.categories[language] = [];
        });
        async.eachLimit(stringsData.uistrings.categories.en, 2, function(string, callback) {
            async.eachLimit(languages, 2, function(language, callback) {
                translate.translations.list({
                    q: string.name,
                    key: key,
                    format: 'text',
                    source: 'en',
                    target: language
                }, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    stringsData.uistrings.categories[language].push({
                        name: result.data.translations[0].translatedText,
                        id: string.id
                    });
                    callback();
                });
            }, function() {
                callback();
            });
        }, function() {
            callback();
        });
    },

    // Translate image modes
    function(callback) {
        languages.forEach(function(language) {
            stringsData.uistrings.modes[language] = [];
        });
        async.eachLimit(stringsData.uistrings.modes.en, 2, function(string, callback) {
            async.eachLimit(languages, 2, function(language, callback) {
                translate.translations.list({
                    q: string.name,
                    key: key,
                    format: 'text',
                    source: 'en',
                    target: language
                }, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    stringsData.uistrings.modes[language].push({
                        name: result.data.translations[0].translatedText,
                        id: string.id
                    });
                    callback();
                });
            }, function() {
                callback();
            });
        }, function() {
            callback();
        });
    },

    // Translate other strings.
    function(callback) {
        async.eachLimit(Object.keys(stringsData.uistrings), 2, function(id, callback) {
            if (id == 'modes' || id == 'categories') {
                callback();
                return;
            }

            async.eachLimit(languages, 2, function(language, callback) {
                translate.translations.list({
                    q: stringsData.uistrings[id].en,
                    key: key,
                    format: 'text',
                    source: 'en',
                    target: language
                }, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    stringsData.uistrings[id][language] = result.data.translations[0].translatedText;
                    callback();
                });
            }, function() {
                callback();
            });
        }, function() {
            callback();
        });
    }
], function() {
    console.log('done');
    fs.writeFile(stringsFile, JSON.stringify(stringsData, null, 2));
});
