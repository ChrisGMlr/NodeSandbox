StimApp.Models.POIEditorModel = Backbone.Model.extend({
	_pois: null,
	_categories: [],
	_modes: [],


	defaults: {
		isTyping: false,
		poiList: [],
		categoryList: [],
		modesList: [],
		pois: null,
	},
	constructor: function(pois, categories, modes) {
		Backbone.Model.apply(this);
		this._pois = pois;
		this._categories = categories;
		this.setCategoryList();

		this._modes = modes;
		this.setModesList();

		//For renderig in the editor
		var poiJSONData = {
			"pois": pois
		};
		this.set('pois', poiJSONData);
	},

	setPOIList: function() {

		var poiArray = this._pois;
		var modelArray = [];

		for (var i = 0; i < poiArray.length; i++) {

			//Creating a model with constructor values set to 0. These would be set in teh POIEditorView.
			var poiModel = new StimApp.Models.CubePOIModel(0, 0, 0, 0, {
				x: 0,
				y: 0
			});

			poiModel.set('id', poiArray[i].id);
			poiModel.set('title', poiArray[i].title);
			poiModel.set('description', poiArray[i].description);
			poiModel.set('categories', poiArray[i].categories);
			poiModel.set('images', poiArray[i].images);
			poiModel.set('modes', poiArray[i].modes);
			poiModel.set('isSurpriseSpot', poiArray[i].isSurpriseSpot);

			poiModel.set('headingDay', poiArray[i].day.heading);
			poiModel.set('pitchDay', poiArray[i].day.pitch);
			poiModel.set('descriptionZoomDay', poiArray[i].day.descriptionZoom);
			poiModel.set('revealZoomDay', poiArray[i].day.revealZoom);

			poiModel.set('headingNight', poiArray[i].night.heading);
			poiModel.set('pitchNight', poiArray[i].night.pitch);
			poiModel.set('descriptionZoomNight', poiArray[i].night.descriptionZoom);
			poiModel.set('revealZoomNight', poiArray[i].night.revealZoom);

			modelArray.push(poiModel);
		}

		this.set('poiList', modelArray);
	},

	setCategoryList: function() {

		var categoryArray = [];
		for (var i = 0; i < this._categories.length; i++) {
			var category = {
				categoryName: null,
				id: null,
			};

			category.categoryName = this._categories[i].name;
			category.id = this._categories[i].id;

			categoryArray.push(category);
		}

		this.set('categoryList', categoryArray);
	},

	setModesList: function() {
		var modesArray = [];
		for (var i = 0; i < this._modes.length; i++) {
			var mode = {
				modeName: null,
				id: null,
			};

			mode.modeName = this._modes[i].name;
			mode.id = this._modes[i].id;

			modesArray.push(mode);
		}

		this.set('modesList', modesArray);
	},



});