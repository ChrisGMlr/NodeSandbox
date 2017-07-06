var fs = require('fs');
var templateFile = "../app/content/poisTranslation.json";
var actualFile = "../app/content/pois.json";

var templateData = JSON.parse(fs.readFileSync(templateFile).toString());
var actualData = JSON.parse(fs.readFileSync(actualFile).toString());

var newtitle = {
	"en": "",
	"es": "",
	"fr": "",
	"zh": "",
	"ge": ""
};

var newdescription = {
	"en": "",
	"es": "",
	"fr": "",
	"zh": "",
	"ge": ""
};


var actualArray = actualData.pointsOfInterest;
var templateArray = templateData.pois.poi;

for (var i = 0; i < actualArray.length; i++) {
	for (var j = 0; j < templateArray.length; j++) {
		var tempPOI = templateArray[j];
		if (tempPOI.hasOwnProperty('id') && tempPOI.id != undefined && tempPOI.id != null) {
			if (tempPOI.id == actualArray[i].id) {
				actualArray[i].title.en = tempPOI.titleEN;
				actualArray[i].title.es = tempPOI.titleES;
				actualArray[i].title.fr = tempPOI.titleFR;
				actualArray[i].title.zh = tempPOI.titleZH;
				actualArray[i].title.ge = tempPOI.titleGE;

				actualArray[i].description.en = tempPOI.descEN;
				actualArray[i].description.es = tempPOI.descES;
				actualArray[i].description.fr = tempPOI.descFR;
				actualArray[i].description.zh = tempPOI.descZH;
				actualArray[i].description.ge = tempPOI.descGE;
			}
		}
	}
}

actualData.pointsOfInterest = actualArray;
fs.writeFileSync(actualFile, JSON.stringify(actualData, null, 2));