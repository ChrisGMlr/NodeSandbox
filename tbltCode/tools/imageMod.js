var fs = require('fs');
var parsedData;
var fileName = '../app/content/pois.json';
fs.readFile(fileName, function(err, data) {
	if (err) throw err;
	parsedData = JSON.parse(data.toString());


	parsedData.pointsOfInterest.forEach(function(poi) {
		var poiImages = {
			"file1": "",
			"attribution1": "",
			"file2": "",
			"attribution2": "",
			"file3": "",
			"attribution3": "",
			"file4": "",
			"attribution4": "",
			"file5": "",
			"attribution5": "",
			"file6": "",
			"attribution6": "",
			"file7": "",
			"attribution7": "",
			"file8": "",
			"attribution8": "",
			"file9": "",
			"attribution9": "",
			"file10": "",
			"attribution10": ""
		};
		var i = 1;
		poi.images.forEach(function(image) {
			poiImages["file" + i] = image.file;
			poiImages["attribution" + i] = image.attribution;
			i++;
		});

		poi.images = poiImages;

	});

	// save the file again
	fs.writeFileSync(fileName, JSON.stringify(parsedData, null, 2));

	//WriteToXML
	//writeToXml();
});