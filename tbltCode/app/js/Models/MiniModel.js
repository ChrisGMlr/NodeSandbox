StimApp.Models.MiniModel = Backbone.Model.extend({

	_pois: null,

	defaults: {
		mapWidth: 662,
		mapHeight: 85,
		hlookat: 0,
		vlookat: 0,

		miniPOIPositions: [],
	},
	constructor: function(pois, defaulthlookat, defaultvlookat) {
		Backbone.Model.apply(this);
		this._pois = pois;
		this.set('hlookat', defaulthlookat);
		this.set('vlookat', defaultvlookat);
	},

	setMiniView: function() {
		/*
	latitude    = 41.145556; // (φ)
	longitude   = -73.995;   // (λ)

	mapWidth    = 200;
	mapHeight   = 100;

	// get x value
	x = (longitude+180)*(mapWidth/360)

	// convert from degrees to radians
	latRad = latitude*PI/180;

	// get y value
	mercN = ln(tan((PI/4)+(latRad/2)));
	y     = (mapHeight/2)-(mapWidth*mercN/(2*PI));
		*/

		var mapWidth = this.get('mapWidth');
		var mapHeight = this.get('mapHeight');
		var latitude = null;
		var longitude = null;
		var positionArray = [];

		var mode = StimApp.model.get('currMode');

		for (var i = 0; i < this._pois.length; i++) {

			longitude = this._pois[i][mode].heading;
			latitude = this._pois[i][mode].pitch;

			var xCoord = (longitude + 180) * (mapWidth / 360);

			var latRad = latitude * Math.PI / 180;
			var mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));

			var yCoord = (mapHeight / 2) - (mapWidth * mercN / (2 * Math.PI));

			var position = {
				x: xCoord,
				y: yCoord
			};

			positionArray.push(position);

		}

		this.set('miniPOIPositions', positionArray);
	},

});