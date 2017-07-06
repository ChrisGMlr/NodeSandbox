StimApp.Models.POICollection = Backbone.Collection.extend({

	_pois: null,
	_modelList: [],

	constructor: function(pois) {
		Backbone.Collection.apply(this);
		this._pois = pois;
	},

	setPOIList: function() {
		var that = this;
		var poiArray = this._pois;
		for (var i = 0; i < poiArray.length; i++) {

			//Creating a model with constructor values set to 0. These would be set in teh POIEditorView.
			var poiModel = new StimApp.Models.POIModel(0, 0, 0, 0, {
				x: 0,
				y: 0
			});

			poiModel.set('id', "POI" + poiArray[i].id); //make sure if you change this id, this needs to be changed in the poiParser/index.js file as well
			poiModel.set('titles', poiArray[i].title);
			poiModel.set('title', poiArray[i].title.en); //default is english
			poiModel.set('categories', poiArray[i].categories);
			poiModel.set('modes', poiArray[i].modes);
			poiModel.set('isSurpriseSpot', poiArray[i].isSurpriseSpot);

			poiModel.set('headingDay', poiArray[i].day.heading);
			poiModel.set('pitchDay', poiArray[i].day.pitch);
			poiModel.set('descriptionZoomDay', poiArray[i].day.descriptionZoom);
			poiModel.set('revealZoomDay', poiArray[i].day.revealZoom);

			// poiModel.set('headingNight', poiArray[i].night.heading);
			// poiModel.set('pitchNight', poiArray[i].night.pitch);
			// poiModel.set('descriptionZoomNight', poiArray[i].night.descriptionZoom);
			// poiModel.set('revealZoomNight', poiArray[i].night.revealZoom);

			poiModel.set('media', poiArray[i].media);
			poiModel.set('caseStudies', poiArray[i].caseStudies);


			// this.setIconFileNames(poiModel);
			poiModel.set('normalIcon', 'content/resources/gui/poicon.png');
			poiModel.set('pressedIcon', 'content/resources/gui/poicon-pressed.png');

			poiModel.set('backCrossIcon', 'content/resources/gui/GreenBackCrossButton.png');
			poiModel.set('crossButton', 'content/resources/gui/crossButton.png');
			poiModel.set('backButton', 'content/resources/gui/backButton.png');
			this._modelList.push(poiModel);
		}
		this.add(this._modelList);

		// _.each(this._modelList, function(model) {
		// 	that.add(model);
		// });

	},

	setIconFileNames: function(poiModel) {
		var categories = poiModel.get('categories');
		var isSurpriseSpot = poiModel.get('isSurpriseSpot');
		var directory = "content/resources/gui/";
		var optionFileName = "";
		var colorName = "";
		var dotFileName = "";
		var pressedOptionFileName = "";
		var backCrossFileName = "";

		// if (isSurpriseSpot) {
		// 	optionFileName += "MPOI-";
		// 	dotFileName += "MPOI-Press-";
		// } else {
		// 	optionFileName += "POI-";
		// 	dotFileName += "POI-Press-";
		// }
		if (_.contains(categories, "td")) {
			colorName += "Blue";
		} else if (_.contains(categories, "ace")) {
			colorName += "Green";
		} else if (_.contains(categories, "community")) {
			colorName += "Red";
		} else if (_.contains(categories, "solutions")) {
			colorName += "Yellow";
		}

		//Add file extension
		optionFileName = colorName + "POIcon.png";
		dotFileName = colorName + "Dot.png";
		pressedOptionFileName = colorName + "POIconPressed.png";
		backCrossFileName = colorName + "BackCrossButton.png";
		backButtonFileName = "backButton.png";
		crossButtonFileName = "crossButton.png";

		poiModel.set('catIcon', directory + optionFileName);
		poiModel.set('dotIcon', directory + dotFileName);
		poiModel.set('catIconPressed', directory + pressedOptionFileName);
		poiModel.set('backCrossIcon', directory + backCrossFileName);
		poiModel.set('crossButton', directory + crossButtonFileName);
		poiModel.set('backButton', directory + backButtonFileName);
	},

});