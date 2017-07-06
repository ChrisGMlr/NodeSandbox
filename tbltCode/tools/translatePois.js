// Make automated translations and put POIs in order by ID.

var Mustache = require('mustache');
var fs = require('fs');
var google = require('googleapis');
var translate = google.translate('v2');
var async = require('async');

var languages = ['zh', 'fr', 'es'];
var key = 'AIzaSyBholyY68hfBze9J5siZSy4KMdgXgnC4as';

// Load POIs from JSON
var poiFile = '../app/content/pois.json';
var poiData = JSON.parse(fs.readFileSync(poiFile).toString());
var pois = poiData.pointsOfInterest;
pois.sort(function(a, b) {
    return a.id - b.id;
});

async.eachLimit(pois, 5, function(poi, callback) {
    async.parallel([

        // Translate titles.
        function(callback) {
            async.each(languages, function(language, callback) {
                translate.translations.list({
                    q: poi.title.en,
                    key: key,
                    format: 'html',
                    source: 'en',
                    target: language
                }, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    poi.title[language] = result.data.translations[0].translatedText;
                    callback();
                });
            }, function(err) {
                callback();
            });
        },

        // Translate descriptions.
        function(callback) {
            async.each(languages, function(language, callback) {
                translate.translations.list({
                    q: poi.description.en,
                    key: key,
                    format: 'html',
                    source: 'en',
                    target: language
                }, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    poi.description[language] = result.data.translations[0].translatedText;
                    callback();
                });
            }, function(err) {
                callback();
            });
        },
    ], function(err) {
        callback();
    });
}, function(err) {

    // Update the file.
    poiData.pointsOfInterest = pois;
    fs.writeFile(poiFile, JSON.stringify(poiData, null, 2));
});
