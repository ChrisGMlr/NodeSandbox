StimApp.Views.POICollectionView = Backbone.View.extend({
	_krpano: null,
	_container: null,
	_fov: null,
	_containerWidth: null,
	_containerHeight: null,
	_selectedPOI: null,
	_poiList: [], //List of all POI views

	initialize: function() {
		var that = this;
		this.initializePrivateVariables();


		//This is the ID of the embed element that krpano embeds
		this._krpano = document.getElementById("krpanoSWFObject");

		//This is the id of the div on which the POIs will be rendered
		this._container = this.$el;

		this._fov = this._krpano.get('view.fov'); //getting initial fov
		this.render();

		if (this.model.models.length === 0) //Check if the collection is already populated, used for rerendering on mode change
		{
			this.listenTo(this.model, 'add', this.readAndRenderPois);
		} else {
			this.model.each(function(poi) {
				that.readAndRenderPois(poi);
			});
		}
		//this.model.on('change:poiList', this.readAndRenderPois, this);

		this.model.setPOIList();

		this.listenTo(StimApp.model, 'change:currentCategory', this.filterPOIsOnCategoryChange);

		this.listenTo(StimApp.model, 'panning', this.onviewchange);

		//next and previous keypress
		var boundFunction = _.bind(this.keyDownEvent, this);
		$(document).on('keydown', boundFunction);

		//reset the selectedCubePOI view value to reset next and previous button behavior
		this.listenTo(StimApp.model, 'change:currMode', function() {
			StimApp.model.set('selectedCubePOI', '1');
		});
	},


	remove: function() {
		this.$el.off();
		this.$el.children().off();
		$('#poiContainer').off();
		$('#poiContainer').children().off();

		this.clearPrivateVariables();
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
		delete this._selectedPOI;
		delete this._poiList; //List of all POI views

		this.initializePrivateVariables();
	},

	initializePrivateVariables: function() {
		this._krpano = null;
		this._container = null;
		this._fov = null;
		this._containerWidth = null;
		this._containerHeight = null;
		this._selectedPOI = null;
		this._poiList = []; //List of all POI views
		this._poiList.length = 0;
	},


	readAndRenderPois: function(poi) {

		if ($.inArray(StimApp.model.get('currMode'), poi.get('modes')) == -1) //do not render if poi is not present in current mode
			return;

		var h = null;
		var v = null;
		var position = null;
		var anchorPoint = null;

		if (StimApp.model.get('currMode') == 'day') {
			h = poi.get('headingDay');
			v = poi.get('pitchDay');

			anchorPoint = {
				x: 0,
				y: 0
			};

			poi.heading = h;
			poi.pitch = v;
			poi.anchorPoint = anchorPoint;
			poi.set('descriptionZoom', poi.get('descriptionZoomDay'));
			poi.set('revealZoom', poi.get('revealZoomDay'));

		} else if (StimApp.model.get('currMode') == 'night') {
			h = poi.get('headingNight');
			v = poi.get('pitchNight');

			anchorPoint = {
				x: 0,
				y: 0
			};

			poi.heading = h;
			poi.pitch = v;
			poi.anchorPoint = anchorPoint;
			poi.set('descriptionZoom', poi.get('descriptionZoomNight'));
			poi.set('revealZoom', poi.get('revealZoomNight'));
		}

		//Rest of the properties are already set in POICollection.js
		var poiID = poi.get('id');
		this._krpano.get('hotspot[' + poiID + ']').ath = h;
		this._krpano.get('hotspot[' + poiID + ']').atv = v;

		// this._krpano.get('hotspot[' + poiID + ']').url = poi.get('normalIcon');

		var poiView = new StimApp.Views.POIView({
			model: poi,
			el: $(this._krpano.get('hotspot[' + poiID + ']').sprite),
			//the element is initialized by default in the POIView
		});

		//List of all the pois (shown and hidden)
		this._poiList.push(poiView);

	},

	/*
		onviewchange: function() {
			//update POI positions
			for (var i = 0; i < this._poiList.length; i++) {
				this.positionPoi(this._poiList[i]);
			}
		},
		*/

	filterPOIsOnCategoryChange: function(e) {
		var that = this;

		if (StimApp.model.get('currentCategory') == 'all') {
			_.each(this._poiList, function(poi) {

				poi.model.set('isHidden', (that._krpano.get('view.fov') > poi.model.get('revealZoom'))); //checking if the POI should be hidden for the given zoom level

				if (!poi.model.get('isHidden')) {
					poi.showPOI();
				}

				//when it is all categories, show all MiniPOIs, irrespecitve of their reveal zoom
				poi.showMiniPOI();

			});
			return;
		}

		for (var i = 0; i < that._poiList.length; i++) {

			that._poiList[i].model.set('isHidden', (that._krpano.get('view.fov') > that._poiList[i].model.get('revealZoom'))); //checking if the POI should be hidden for the given zoom level


			if (_.contains(that._poiList[i].model.get('categories'), StimApp.model.get('currentCategory'))) {
				if (!that._poiList[i].model.get('isHidden')) {
					that._poiList[i].showPOI();
				}

				//when it is all categories, show all MiniPOIs, irrespecitve of their reveal zoom
				that._poiList[i].showMiniPOI();
			} else {
				that._poiList[i].hidePOI();
				that._poiList[i].hideMiniPOI();
			}
		}
	},

	keyDownEvent: function(e) {
		if (e.keyCode == 221 || e.keyCode == 219) {
			this.moveToNextPOI(e);
		}
	},

	moveToNextPOI: function(e) {
		if (StimApp.model.get('currentCategory') != 'all' || StimApp.model.get('selectedCubePOI') == '1')
			return;

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

		StimApp.model.set('selectedCubePOI', nextPOIView.cid);
	},

});