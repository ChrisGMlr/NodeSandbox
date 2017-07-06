StimApp.Views.POIEditorView = Backbone.View.extend({

	_krpano: null,
	_container: null,
	_fov: null,
	_containerWidth: null,
	_containerHeight: null,
	_poiArray: [], //List of Saved POIs only
	_poiList: [], //List of POIs renderd on the screen (Even unsaved ones)
	_selectedPOI: null,
	fieldTitle: "POI Name",
	_isTyping: false,
	_isSelected: false,
	_isSaving: false,
	_element: null,


	defaults: {
		model: StimApp.Models.POIEditorModel,
	},

	initialize: function() {
		var that = this;
		this._poiList.length = 0;

		//This is the ID of the embed element that krpano embeds
		this._krpano = document.getElementById("krpanoSWFObject");

		//This is the id of the div on which the POIs will be rendered
		this._container = this.$el;

		this._fov = this._krpano.get('view.fov'); //getting initial fov
		this.render();

		var boundFunction = _.bind(this.keyDownEvent, this);
		$(document).on('keydown', boundFunction);

		//Read the saved POIs from previous session and display them
		this.listenTo(this.model, 'change:poiList', this.readAndRenderPois);
		// StimApp.model.on('change:currMode', function(e) {
		// 	that.model.get('poiList')
		// }, this);
		this.model.setPOIList();

		this.listenTo(StimApp.model, 'change:currentCategory', this.filterPOIsOnCategoryChange);
		this.listenTo(StimApp.model, 'panning', this.onviewchange);

		$('#poiSelect').change(function() {
			console.log(this.value);
			$('#poiList select').val($('#poiSelect').val());
			that.lookToPOI($('#poiList select option:selected').attr('id'));
		});
	},

	remove: function() {
		this._krpano = null;
		this._container = null;
		this._fov = null;
		this.model.off('change:poiList', this.readAndRenderPois, this);
		// StimApp.model.off('panning', this.onviewchange, this);

		for (var i = 0; i < this._poiList.length; i++) {
			this._poiList[i].removePOI();
			//delete this.poiList[i];
		}

		this.$el.off();
		this.$el.children().off();
		$('#poiContainer').off();
		$('#poiContainer').children().off();

		this.clearPrivateVariables();
		var boundFunction = _.bind(this.keyDownEvent, this);
		$(document).off('keydown', boundFunction);

		this.stopListening();
		// COMPLETELY UNBIND THE VIEW
		this.undelegateEvents();

		this.$el.removeData().unbind();

		// Remove view from DOM
		Backbone.View.prototype.remove.call(this);

		Backbone.View.prototype.remove.apply(this, arguments);
	},

	clearPrivateVariables: function() {
		delete this._krpano;
		delete this._container;
		delete this._fov;
		delete this._containerWidth;
		delete this._containerHeight;
		delete this._poiArray; //List of Saved POIs only
		delete this._poiList; //List of POIs renderd on the screen (Even unsaved ones)
		delete this._selectedPOI;
		delete this.fieldTitle;
		delete this._isTyping;
		delete this._isSelected;
		delete this._isSaving;
		delete this._element;

		// resetting everything to null

		this._krpano = null;
		this._container = null;
		this._fov = null;
		this._containerWidth = null;
		this._containerHeight = null;
		this._poiArray = []; //List of Saved POIs only
		this._poiList = []; //List of POIs renderd on the screen (Even unsaved ones)
		this._poiList.length = 0;
		this._selectedPOI = null;
		this.fieldTitle = "POI Title";
		this._isTyping = false;
		this._isSelected = false;
		this._isSaving = false;
		this._elemen = null;
	},

	keyDownEvent: function(e) {
		if (!this._isTyping && !this._isSelected && !this._isSaving) //making sure nothing is selected and the user is not typing into the poi or not saving / selecting it
			this.addPoiOnScreen(e);
		else if (!this._isTyping && this._isSelected && !this._isSaving) {
			this.moveToNextPOI(e);
		}
	},

	readAndRenderPois: function() {
		this._poiArray = [];
		this._poiArray = this.model.get('poiList');
		for (var i = 0; i < this._poiArray.length; i++) {
			// console.log('rendered');
			var h = null;
			var v = null;
			var position = null;
			var anchorPoint = null;

			if (StimApp.model.get('currMode') == 'day') {
				h = this._poiArray[i].get('headingDay');
				v = this._poiArray[i].get('pitchDay');

				position = this._krpano.spheretoscreen(h, v);
				anchorPoint = {
					x: 0,
					y: 0
				};

				this._poiArray[i].leftTranslate = position.x;
				this._poiArray[i].topTranslate = position.y;
				this._poiArray[i].heading = h;
				this._poiArray[i].pitch = v;
				this._poiArray[i].anchorPoint = anchorPoint;
				this._poiArray[i].set('descriptionZoom', this._poiArray[i].get('descriptionZoomDay'));
				this._poiArray[i].set('revealZoom', this._poiArray[i].get('revealZoomDay'));

			} else if (StimApp.model.get('currMode') == 'night') {
				h = this._poiArray[i].get('headingNight');
				v = this._poiArray[i].get('pitchNight');

				position = this._krpano.spheretoscreen(h, v);
				anchorPoint = {
					x: 0,
					y: 0
				};

				this._poiArray[i].leftTranslate = position.x;
				this._poiArray[i].topTranslate = position.y;
				this._poiArray[i].heading = h;
				this._poiArray[i].pitch = v;
				this._poiArray[i].anchorPoint = anchorPoint;
				this._poiArray[i].set('descriptionZoom', this._poiArray[i].get('descriptionZoomNight'));
				this._poiArray[i].set('revealZoom', this._poiArray[i].get('revealZoomNight'));
			}

			var element = $(Mustache.render($('#poiShowTemplate').html()));
			var poiView = new StimApp.Views.CubePOIView({
				model: this._poiArray[i],
				el: element,
				//the element is initialized by default in the CubePOIView
			});
			this.addPoi(poiView);
			this._poiArray[i].set('newPOI', false);
			//position it now
			this.updatePoi(poiView);


			//Just to ensure that the updated poiList doesn't trigger this function again, everytime the saveToJSON function is called
			this.model.off('change:poiList', this.readAndRenderPois, this);
		}

	},

	render: function() {
		$('#poiList').append(Mustache.render($('#editorDropDownTemplate').html(), this.model.get('pois')));
		$('#poiSelect').combify();
	},

	addPoiOnScreen: function(e) {
		//65 is the ASCII code for 'a'
		if (e.keyCode === 65) {
			var krpano = this._krpano;

			if (krpano && krpano.get) // it can take some time until krpano is loaded and ready
			{
				krpano.call("screentosphere(mouse.x, mouse.y, mouseath, mouseatv); js( StimApp.view._poiEditor.showmouseinfo() );");
			}
		}
	},

	moveToNextPOI: function(e) {
		if (e.keyCode != 221 && e.keyCode != 219) {
			return;
		}
		var keycode = e.keyCode;
		var id = StimApp.model.get('selectedCubePOI');
		var currentPOIView = null;
		var nextPOIView = null;
		for (var i = 0; i < this._poiList.length; i++) {
			if (this._poiList[i].cid === id) {
				currentPOIView = this._poiList[i];
				if (keycode === 221)
					nextPOIView = this._poiList[(i + 1) % this._poiList.length];
				else if (keycode === 219) {
					if (i === 0)
						nextPOIView = this._poiList[this._poiList.length - 1];
					else
						nextPOIView = this._poiList[(i - 1) % this._poiList.length];
				}

				break;
			}
		}

		if (!nextPOIView)
			return;

		var heading = null;
		var pitch = null;
		var fov = null;

		heading = nextPOIView.model.get('headingDay');
		pitch = nextPOIView.model.get('pitchDay');
		fov = nextPOIView.model.get('descriptionZoomDay');

		if (!heading || !pitch || !fov)
			return;

		currentPOIView.model.set('isSelected', false);

		nextPOIView.model.set('isSelected', true);

		var krpano = document.getElementById('krpanoSWFObject');
		krpano.set('view.hlookat', heading);
		krpano.set('view.vlookat', pitch);
		krpano.set('view.fov', fov);

		$('#krpanoSWFObject').click();

		$(nextPOIView.el).focus();
		$(nextPOIView.el).click();
	},

	// get the pitch and heading and convert them to screen coordinates
	positionPoi: function(cubePoiView) {
		var krpano = this._krpano;
		var containerWidth = this._container.outerWidth();
		var containerHeight = this._container.outerHeight();

		var h = cubePoiView.model.heading;
		var v = cubePoiView.model.pitch;

		var position = krpano.spheretoscreen(h, v);

		var left;
		var top;
		var right;
		var bottom;

		if (!isNaN(position.x) && !isNaN(position.y)) {
			left = position.x - cubePoiView.model.anchorPoint.x;
			top = position.y - cubePoiView.model.anchorPoint.y;
			right = left + cubePoiView.model.width;
			bottom = top + cubePoiView.model.height;

			//Updating the position when the panorama is panned and the x and y change accordingly
			cubePoiView.model.leftTranslate = position.x;
			cubePoiView.model.topTranslate = position.y;
		}

		if (isNaN(position.x) ||
			isNaN(position.y) ||
			right < 0 ||
			bottom < 0 ||
			left > containerWidth ||
			top > containerHeight) {
			if ($(cubePoiView.el).is(":visible")) {
				$(cubePoiView.el).hide();
			}
		} else {
			if (!$(cubePoiView.el).is(":visible") && !cubePoiView.model.get('isHidden')) {
				$(cubePoiView.el).show();
			}

			//Translating the rendered poi div to the right position
			var transform = "translate(" + left + "px, " + top + "px)";

			$(cubePoiView.el).css({
				"-webkit-transform": transform
			});

			$(cubePoiView.el).css({
				"transform": transform
			});

			$(cubePoiView.el).css({
				'-ms-transform': transform
			});

			$(cubePoiView.el).css({
				'-moz-transform': transform
			});
		}
	},

	updatePoiDimensions: function(cubePoiView) {
		cubePoiView.model.width = $(cubePoiView.el).outerWidth();
		cubePoiView.model.height = $(cubePoiView.el).outerHeight();
	},

	addPoi: function(cubePoiView) {
		var containerHeight = this._container.outerHeight();
		var that = this;
		this._poiList.push(cubePoiView);
		cubePoiView.render(this._container); //Render the POI

		this.updatePoiDimensions(cubePoiView);
		cubePoiView.model.containerHeight = containerHeight;
		$(cubePoiView.el).addClass('unsavedPoi'); //red button for newly added poi
		this.positionPoi(cubePoiView);

		this.listenTo(cubePoiView, 'viewRemoved', this.updatePoiList);
		this.listenTo(cubePoiView, 'viewMoved', this.repositionPOI);
		this.listenTo(cubePoiView, 'setDescriptionZoom', this.setDescriptionZoom);
		this.listenTo(cubePoiView, 'setRevealZoom', this.setRevealZoom);
		this.listenTo(cubePoiView, "dataReady", this.saveToJSON);


		this.listenTo(cubePoiView.model, "change:isTyping", this.setTyping);
		this.listenTo(cubePoiView.model, "change:isSelected", this.setSelected);
		this.listenTo(cubePoiView.model, "change:isSaving", this.setSaving);

	},

	setTyping: function(model, value, options) {
		this._isTyping = value;
	},

	setSaving: function(model, value, options) {
		this._isSaving = value;
		if (this._isSaving) {
			//code to save the poi value to json file
		}
	},

	setSelected: function(model, value, options) {
		this._isSelected = value;
	},
	updatePoi: function(cubePoiView) {
		this.positionPoi(cubePoiView);
	},

	updatePoiList: function(e) {
		for (var i = 0; i < this._poiList.length; i++) {
			if (this._poiList[i] == e) {
				this._poiList.splice(i, 1);
				break;
			}
		}

		//Removing the delted poi from _poiArray
		for (var j = 0; j < this._poiArray.length; j++) {
			if (this._poiArray[j].cid == e.model.cid) {
				this._poiArray.splice(j, 1);
				break;
			}
		}
		ampm.socket().emit('newPoi', this.getJSONArray());

	},

	onviewchange: function() {

		//update POI positions
		for (var i = 0; i < this._poiList.length; i++) {
			this.positionPoi(this._poiList[i]);
		}
	},

	showmouseinfo: function() {
		var krpano = this._krpano;
		var mouse_at_x = krpano.get("mouse.x");
		var mouse_at_y = krpano.get("mouse.y");
		var mouse_at_h = krpano.get("mouseath");
		var mouse_at_v = krpano.get("mouseatv");

		console.warn(mouse_at_x + ' : ' + mouse_at_y + ' : ' + mouse_at_h + ' : ' + mouse_at_v);

		if (mouse_at_h !== null && mouse_at_v !== null) {
			//setting 0,0 here causes it to anchor to the top left of the elem
			var poiModel = new StimApp.Models.CubePOIModel(mouse_at_x, mouse_at_y, mouse_at_h, mouse_at_v, {
				x: 0,
				y: 0
			});

			var element = $(Mustache.render($('#poiShowTemplate').html()));
			var poiView = new StimApp.Views.CubePOIView({
				model: poiModel,
				el: element,
				//the element is initialized by default in the CubePOIView
			});
			this.addPoi(poiView);
			poiModel.set('newPOI', true);
			//position it now
			this.updatePoi(poiView);
		}
	},

	repositionPOI: function(cubePoiView) {
		var krpano = this._krpano;
		var containerWidth = this._container.outerWidth();
		var containerHeight = this._container.outerHeight();


		var position = {
			x: cubePoiView.model.leftTranslate,
			y: cubePoiView.model.topTranslate
		};

		var hv = krpano.screentosphere(position.x, position.y);

		cubePoiView.model.heading = hv.x;
		cubePoiView.model.pitch = hv.y;


		var left;
		var top;
		var right;
		var bottom;

		if (!isNaN(position.x) && !isNaN(position.y)) {
			left = position.x - cubePoiView.model.anchorPoint.x;
			top = position.y - cubePoiView.model.anchorPoint.y;
			right = left + cubePoiView.model.width;
			bottom = top + cubePoiView.model.height;
		}

		if (isNaN(position.x) ||
			isNaN(position.y) ||
			right < 0 ||
			bottom < 0 ||
			left > containerWidth ||
			top > containerHeight) {
			if ($(cubePoiView.el).is(":visible")) {
				$(cubePoiView.el).hide();
			}
		} else {
			if (!$(cubePoiView.el).is(":visible") && !cubePoiView.model.get('isHidden')) {
				$(cubePoiView.el).show();
			}

			//TODO: We could experiment with doubling the size/font of elements, then scaling them down with this transform.
			//      It might produce better rendered text post-translate.

			//Translating the rendered poi div to the right position
			var transform = "translate(" + left + "px, " + top + "px)";
			$(cubePoiView.el).css({
				"-webkit-transform": transform
			});

			$(cubePoiView.el).css({
				"transform": transform
			});

			$(cubePoiView.el).css({
				'-ms-transform': transform
			});

			$(cubePoiView.el).css({
				'-moz-transform': transform
			});
		}
	},

	setRevealZoom: function(cubePoiView) {
		var zoomValue = this._krpano.get('view.fov');
		cubePoiView.model.set('revealZoom', zoomValue);
	},

	setDescriptionZoom: function(cubePoiView) {
		var zoomValue = this._krpano.get('view.fov');
		cubePoiView.model.set('descriptionZoom', zoomValue);
	},

	saveToJSON: function(cubePoiView) {

		var flag = false;
		for (var i = 0; i < this._poiArray.length; i++) {
			if (this._poiArray[i].cid == cubePoiView.model.cid) {
				flag = true;
				this._poiArray[i] = cubePoiView.model;
				break;
			}
		}

		if (flag === false)
			this._poiArray.push(cubePoiView.model);

		//Update poiList on POIEditorModel to reflect changes on mode change to day / night
		this.model._pois = this.getJSONArray();

		ampm.socket().emit('newPoi', this.getJSONArray());

	},

	getJSONArray: function() {
		var JSONArray = [];
		var poiArray = this._poiArray;

		for (var i = 0; i < poiArray.length; i++) {
			var newPoi = {
				"id": poiArray[i].get('id'),
				"day": {
					"heading": poiArray[i].get('headingDay'),
					"pitch": poiArray[i].get('pitchDay'),
					"descriptionZoom": poiArray[i].get('descriptionZoomDay'),
					"revealZoom": poiArray[i].get('revealZoomDay'),
				},
				"night": {
					"heading": poiArray[i].get('headingNight'),
					"pitch": poiArray[i].get('pitchNight'),
					"descriptionZoom": poiArray[i].get('descriptionZoomNight'),
					"revealZoom": poiArray[i].get('revealZoomNight'),
				},

			};

			JSONArray.push(newPoi);
		}

		return JSONArray;

	},

	filterPOIsOnCategoryChange: function(e) {
		var that = this;

		if (StimApp.model.get('currentCategory') == 'all') {
			_.each(this._poiList, function(poi) {
				poi.showPOI();
				that.positionPoi(poi);
			});
			return;
		}
		_.each(this._poiArray, function(poi) {
			for (var i = 0; i < that._poiList.length; i++) {
				if (that._poiList[i].model.cid === poi.cid) {

					if (_.contains(that._poiList[i].model.get('categories'), StimApp.model.get('currentCategory'))) {
						that._poiList[i].showPOI();
						that.positionPoi(that._poiList[i]);
					} else
						that._poiList[i].hidePOI();
				}
			}
		});
	},

	lookToPOI: function(poiID) {
		var krpano = document.getElementById('krpanoSWFObject');
		var mode = StimApp.model.get('currMode');
		if (mode == 'day') {
			mode = "Day";
		} else if (mode == "night") {
			mode = "Night";
		}
		for (var i = 0; i < this._poiArray.length; i++) {
			if (this._poiArray[i].get('id') == poiID) {
				krpano.set('view.hlookat', this._poiArray[i].get('heading' + mode));
				krpano.set('view.vlookat', this._poiArray[i].get('pitch' + mode));
				krpano.set('view.fov', this._poiArray[i].get('descriptionZoom' + mode));
				break;
			}
		}
	},
});