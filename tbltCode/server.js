var path = require('path'); //http://nodejs.org/api/path.html
var fs = require('fs'); // http://nodejs.org/api/fs.html
var os = require('os'); // http://nodejs.org/api/os.html
var Mustache = require('mustache');
var fs = require('fs');

var _ = require('lodash'); // Utilities. http://underscorejs.org/
var Backbone = require('backbone'); // Data model utilities. http://backbonejs.org/

var express = require('express'),
    webapp = express(),
    http = require('http'),
    webserver = http.createServer(webapp),
    io = require('socket.io').listen(webserver);

//Logic to read the public read only excel file with all the new POI changes and save it to poiContent.json

var allPOIs = [];
var that = this;
var writeToXml = function() {

    //Generate the new pois.json file and then copy the data to the xml
    //pullDataAndMerge();
    mergeContentPositions();

    var template = '<hotspot name="{{id}}"\n' +
        'type="image"\n' +
        'url="../../resources/poicons/dummypoi.png" \n' +
        'keep="false"\n' +
        'devices="all"\n' +
        'visible="true"\n' +
        'enabled="false"\n' +
        'handcursor="true"\n' +
        'maskchildren="false"\n' +
        'zorder=""\n' +
        'zorder2="0.0"\n' +
        'capture="true"\n' +
        'children="false "\n' +
        'blendmode="normal"\n' +
        'style="slowPOI"\n' +
        'ath="{{day.heading}}"\n' +
        'atv="{{day.pitch}}"\n' +
        'edge="center"\n' +
        'ox="0"\n' +
        'oy="0"\n' +
        'zoom="false"\n' +
        'distorted="false"\n' +
        'rx="0.0"\n' +
        'ry="0.0"\n' +
        'rz="0.0"\n' +
        'details="8"\n' +
        'inverserotation="false"\n' +
        'flying="0.0"\n' +
        'width=""\n' +
        'height=""\n' +
        'scale="1.0"\n' +
        'rotate="0.0"\n' +
        'pixelhittest="false"\n' +
        'smoothing="true"\n' +
        'accuracy="1"\n' +
        'alpha="1.0"\n' +
        'autoalpha="false"\n' +
        'usecontentsize="false"\n' +
        'scale9grid=""\n' +
        'crop=""\n' +
        'onovercrop=""\n' +
        'ondowncrop=""\n' +
        'scalechildren="false"\n' +
        'mask=""\n' +
        'effect=""\n' +
        'onover=""\n' +
        'onhover=""\n' +
        'onout=""\n' +
        'ondown="mouseDown"\n' +
        'onup="mouseUp"\n' +
        'onclick=""\n' +
        'onloaded=""\n' +
        '/>\n';

    var poiFile = 'app/content/pois.json';
    var xmlFileDay = 'app/OneLibertyGigapixelDay.xml';
    //var xmlFileNight = 'app/OneLibertyGigapixelNight.xml';


    // load POIs from json
    var pois = JSON.parse(fs.readFileSync(poiFile).toString()).pointsOfInterest;
    // create xml
    var poisXml = '';
    pois.forEach(function(poi) {
        poi.id = "POI" + poi.id; //making sure the IDs are unique //make sure if you change this id, this needs to be changed in the POICollection.js file as well
        var poiXml = Mustache.render(template, poi);
        poisXml += poiXml;

    });

    // load current xml
    var oldXmlDay = fs.readFileSync(xmlFileDay).toString();
    //var oldXmlNight = fs.readFileSync(xmlFileNight).toString();


    // replace hotspots in current xml with new ones
    oldXmlDay = oldXmlDay.replace(/<!-- hotspots -->[\s\S]*?<!-- hotspots -->/g, '<!-- hotspots -->\n' + poisXml + '<!-- hotspots -->');
    //oldXmlNight = oldXmlNight.replace(/<!-- hotspots -->[\s\S]*?<!-- hotspots -->/g, '<!-- hotspots -->\n' + poisXml + '<!-- hotspots -->');

    //console.log(oldXml);

    // save xml to disk
    fs.writeFileSync(xmlFileDay, oldXmlDay);
    //fs.writeFileSync(xmlFileNight, oldXmlNight);
    console.log('writing to xml complete');

    //Copy the written files to the krpano folder
    fs.createReadStream(xmlFileDay).pipe(fs.createWriteStream('app/content/panorama/day/OneLibertyGigapixelDay.xml'));
    //fs.createReadStream(xmlFileNight).pipe(fs.createWriteStream('app/content/panorama/night/OneLibertyGigapixelNight.xml'));
};

var mergeContentPositions = function() {
    var parsedData;

    // load up the POI file from disk
    var fileName = 'app/content/poiPosition.json';
    data = fs.readFileSync(fileName);
    parsedData = JSON.parse(data.toString());
    var pois = parsedData.pointsOfInterest;

    var format = {
        "id": "{{{poiId}}}",
        "title": {
            "en": "{{{poiCategoryType}}}",
            "es": "",
            "fr": "",
            "zh": "",
            "ge": ""
        },
        "caseStudies": [],
        "categories": [],
        "modes": [
            "day",
            "night"
        ],
        "isSurpriseSpot": false,
        "day": {
            "heading": 44.84995220568169,
            "pitch": 8.170729688034461,
            "descriptionZoom": 5.069629850737342,
            "revealZoom": 90
        },
        "night": {
            "heading": 44.84995220568169,
            "pitch": 8.170729688034461,
            "descriptionZoom": 5.069629850737342,
            "revealZoom": 90
        }
    };

    var caseStudyFormat = {
        "caseStudyName": {
            "en": "{{{csname}}}",
            "es": "",
            "fr": "",
            "zh": "",
            "ge": ""
        },
        "descriptionTitle": {
            "en": "{{{caseStudyTitle}}}",
            "es": "",
            "fr": "",
            "zh": "",
            "ge": ""
        },
        "descriptionBody": {
            "en": "{{{caseStudyProfile}}}{{{caseStudyChallenge}}}{{{caseStudySolution}}}{{{caseStudyResults}}}{{{caseStudyHighlights}}}{{{caseStudyWhy}}}{{{caseStudyQuotes}}}",
            "es": "",
            "fr": "",
            "zh": "",
            "ge": ""
        },
        "media": []
    };

    var cmsContentFileLocation = $$config.contentPath ? path.join($$config.contentPath, 'pois.json') : "app/cmscontent/pois.json";

    data = fs.readFileSync(cmsContentFileLocation);

    data = JSON.parse(data.toString().replace(/\\n/g, "<br>").replace(/\\r/g, ""));

    //1. Merge all caseStudies together
    var items = [];
    var poiList = {};
    var categories = [];
    var media = [];
    _.each(data.PoIList, function(poi) {
        if (poiList.hasOwnProperty(poi.poiId)) {
            //merge data
            if (poiList[poi.poiId].poiSortOrder < poi.poiSortOrder) {
                //trim description fields before pushing
                poi.casestudy = replaceTrimCSDescription(poi.casestudy);
                poiList[poi.poiId].caseStudies.push(poi.casestudy);
                console.log(poi.title);
                poiList[poi.poiId].caseStudies[poiList[poi.poiId].caseStudies.length - 1].csname = poi.title;
            } else { //swap data in ascending order
                var temp = poiList[poi.poiId].caseStudies[poiList[poi.poiId].caseStudies.length - 1];
                poi.casestudy = replaceTrimCSDescription(poi.casestudy);
                poiList[poi.poiId].caseStudies[poiList[poi.poiId].caseStudies.length - 1] = poi.casestudy;
                poiList[poi.poiId].caseStudies[poiList[poi.poiId].caseStudies.length - 1].csname = poi.title;
                console.log("SWAPPING: " + poi.title);
                poiList[poi.poiId].caseStudies.push(temp);
            }
            //update the latest sort order
            poiList[poi.poiId].poiSortOrder = poi.poiSortOrder;

            //add categories to the list
            categories = getCategoryIDsList(poi);
            if (categories.length > 0)
                poiList[poi.poiId].categories = _.union(poiList[poi.poiId].categories, categories);

        } else {
            //add new property
            poiList[poi.poiId] = poi;
            poiList[poi.poiId].caseStudies = [];
            poiList[poi.poiId].caseStudies.push(poi.casestudy);
            poi.casestudy = replaceTrimCSDescription(poi.casestudy);

            poiList[poi.poiId].caseStudies[poiList[poi.poiId].caseStudies.length - 1].csname = poi.title;

            //2. Create category array
            categories = getCategoryIDsList(poi);

            if (categories.length === 0)
                poiList[poi.poiId].categories = [];
            else
                poiList[poi.poiId].categories = categories;
        }

    });

    _.each(poiList, function(poi) {
        //2. merge categories
        format.categories = poi.categories;
        //3. create an array of caseStudies & media per caseStudy
        var allCaseStudies = [];
        _.each(poi.caseStudies, function(caseStudy) {
            //creating media array for video
            var csMedia = [];

            _.each(caseStudy.videosCE, function(video) {
                var media = {
                    "title": {
                        "en": "",
                        "es": "",
                        "fr": "",
                        "zh": "",
                        "ge": ""
                    },
                    "image": "",
                    "video": ""
                };
                media.title.en = video.video.videoTitleCE;
                media.image = video.video.posterCE;
                media.video = video.video.videoCE;
                csMedia.push(media);
            });

            //creating media array for images
            _.each(caseStudy.imagesCE, function(image) {
                var media = {
                    "title": {
                        "en": "",
                        "es": "",
                        "fr": "",
                        "zh": "",
                        "ge": ""
                    },
                    "image": "",
                    "video": ""
                };
                media.title.en = image.image.imageTitleCE;
                media.image = image.image.imageCE;
                media.video = "";
                csMedia.push(media);
            });

            caseStudyFormat.media = csMedia;
            var mergedCSFormat = Mustache.render(JSON.stringify(caseStudyFormat, null, 2), caseStudy);
            allCaseStudies.push(JSON.parse(mergedCSFormat));
        });

        format.caseStudies = allCaseStudies;

        //4. merge position information
        _.each(pois, function(pointOfInterest) {
            if (pointOfInterest.id == poi.poiId) {
                format.day = pointOfInterest.day;
                format.night = pointOfInterest.night;
            }
        });

        var mergedFormat = Mustache.render(JSON.stringify(format, null, 2), poi);
        // treat a space in poi title  like carriage return
        mergedFormat = JSON.parse(mergedFormat);
        mergedFormat.title.en = mergedFormat.title.en.replace(/ /g, "<br>");

        allPOIs.push(mergedFormat);
    });

    //write the json array to pois.json
    var poisJSON = 'app/content/pois.json';
    var poidata = fs.readFileSync(poisJSON);
    parsedData = JSON.parse(poidata.toString());
    parsedData.pointsOfInterest = allPOIs;
    fs.writeFileSync(poisJSON, JSON.stringify(parsedData, null, 2));
    console.log("writing pois.json complete");

};

var replaceTrimCSDescription = function(caseStudy) {
    var caseStudyEdit = caseStudy;
    caseStudyEdit.caseStudyTitle = caseStudy.caseStudyTitle.replace(/(<br>\s*)+$/, '');
    caseStudyEdit.caseStudyProfile = caseStudy.caseStudyProfile.replace(/(<br>\s*)+$/, '');
    caseStudyEdit.caseStudyChallenge = caseStudy.caseStudyChallenge.replace(/(<br>\s*)+$/, '');
    caseStudyEdit.caseStudySolution = caseStudy.caseStudySolution.replace(/(<br>\s*)+$/, '');
    caseStudyEdit.caseStudyResults = caseStudy.caseStudyResults.replace(/(<br>\s*)+$/, '');
    caseStudyEdit.caseStudyHighlights = caseStudy.caseStudyHighlights.replace(/(<br>\s*)+$/, '');
    caseStudyEdit.caseStudyWhy = caseStudy.caseStudyWhy.replace(/(<br>\s*)+$/, '');
    caseStudyEdit.caseStudyQuotes = caseStudy.caseStudyQuotes.replace(/(<br>\s*)+$/, '');
    return caseStudyEdit;
};

var getCategoryIDsList = function(poi) {
    var categories = [];
    _.each(poi.poiProductType, function(cat) {
        switch (cat.type) {
            case "Technologies":
                categories.push("tch");
                break;
            case "Solar":
                categories.push("sol");
                break;
            case "Energy Efficiency":
                categories.push("enrgeffcy");
                break;
            case "Power   Electricity":
                categories.push("pwrelec");
                break;
            case "Natural Gas":
                categories.push("natgas");
                break;
            case "Home Services":
                categories.push("hmser");
                break;
            case "Load Response":
                categories.push("ldres");
                break;
            default:
                break;
        }
    });

    return categories;
};


exports.Plugin = Backbone.Model.extend({
    boot: function() {

        writeToXml();
        io.set('log level', 1); // reduce logging
        webserver.listen(8000); // create webserver

        // routing
        webapp.get('/', function(req, res) {
            res.sendfile(path.resolve(__dirname + '/app/index.html'));
        });

        webapp.use(express.static(path.resolve(__dirname)));
        if ($$config.contentPath) {
            webapp.use('/app/cmscontent/', express.static(path.resolve($$config.contentPath)));
        }

        $$network.transports.socketToApp.sockets.on('connection', _.bind(function(socket) {

            socket.on('newPoi', function(JSONArray) {

                var parsedData;
                // load up the POI file from disk
                var fileName = 'app/content/poiPosition.json';
                fs.readFile(fileName, function(err, data) {
                    if (err) throw err;
                    parsedData = JSON.parse(data.toString());

                    // insert a new item
                    parsedData.pointsOfInterest = JSONArray;

                    // save the file again
                    fs.writeFileSync(fileName, JSON.stringify(parsedData, null, 2));

                    //WriteToXML
                    writeToXml();
                });

                console.log('got message');
                console.log(arguments);
                // write to the POI file
            });

            socket.on('editorToggle', writeToXml);

        }, this));
    }



});
