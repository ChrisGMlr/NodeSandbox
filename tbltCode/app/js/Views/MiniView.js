StimApp.Views.MiniView = Backbone.View.extend({

	_transbox: null,
	_boxWidth: null,
	_boxHeight: null,
	_boxWidthMax: null,
	_boxHeightMax: null,
	_secondBox: null,
	_firstFrame: true,
	_border: 4,
	_poiSize: 6,
	_minVLookAt: -10,
	_maxVLookAt: 80,
	_availableViewAngle: 0, // This value cannot be less than the  VFOV. By default this is 90 degrees


	left: null,
	top: null,
	secondLeft: null,
	passLeft: false,
	passRight: false,

	defaults: {
		model: StimApp.Models.MiniModel,
		miniPOIs: StimApp.Models.POICollectoin,
	},

	initialize: function() {
		this._availableViewAngle = this._maxVLookAt - this._minVLookAt; //needed for lot of different calculations

		this.listenTo(StimApp.model, 'change:currentStrings', this.renderMiniUI);
		this.listenTo(StimApp.model, 'onloadcomplete', this.render);
		this.listenTo(StimApp.model, 'change:currMode', this.hideInnerBox);

		this.listenTo(StimApp.model, 'positionMiniPOI', this.renderMiniPOI);
		this.listenTo(StimApp.model, 'deleteMiniPOI', this.deleteMiniPOI);
		this.listenTo(StimApp.model, 'showMiniPOI', this.showMiniPOI);
		this.listenTo(StimApp.model, 'hideMiniPOI', this.hideMiniPOI);

		this.listenTo(StimApp.model, 'panning', this.moveRectangle);

		//StimApp.model.on('zoomingIn', this.moveRectangle, this);
	},

	displayMiniView: function() {
		//Logic to render the image with the the pois mapped to the image
	},

	render: function() {
		this.$el.children().remove();
		this.$el.append(Mustache.render($('#miniTemplate').html()));
		this.$el.css('width', this.model.get('mapWidth'));
		this.$el.css('height', this.model.get('mapHeight'));

		this.renderMiniUI();

		//Some stuff to do before setting the miniView
		this._transbox = $("#transbox", this.el);
		this._secondBox = $('[id = "transbox"][class = "secondBox"]', this.el);

		this.centerBoxAtStart();
	},

	hideInnerBox: function() {
		this._transbox.hide();
		this._secondBox.hide();
	},

	renderMiniUI: function() {
		//Clear children
		$(".directions").children().remove();
		$(".outTheWindowBG").children().remove();

		//Adding Directions
		$(".directions").append(Mustache.render($('#directionsTemplate').html(), StimApp.model.get('currentStrings')));

		//Adding Out the Window Text
		$(".outTheWindowBG").append(Mustache.render($('#outTheWindowTemplate').html(), StimApp.model.get('currentStrings')));

		this.repositionDirections();
	},

	//default position of the inner box
	setTransboxPproperties: function(krpano) {
		this._boxWidth = krpano.get('view.hfov') * this.model.get('mapWidth') / 360;
		this._boxHeight = krpano.get('view.vfov') * (this.model.get('mapHeight') - 2 * this._border) / this._availableViewAngle;
		this._transbox.css('width', this._boxWidth);
		this._transbox.css('height', this._boxHeight);
		this._secondBox.css('width', this._boxWidth);
		this._secondBox.css('height', this._boxHeight);
	},

	centerBoxAtStart: function() {
		$(this._transbox).show();
		$(this._secondBox).hide();

		//for max zoomed out fovs of krpano, calculate the box width and height
		this._boxWidthMax = StimApp.model.get('currhfov') * this.model.get('mapWidth') / 360;
		this._boxHeightMax = StimApp.model.get('currvfov') * (this.model.get('mapHeight') - 2 * this._border) / this._availableViewAngle;

		this._boxWidth = this._boxWidthMax;
		this._boxHeight = this._boxHeightMax;
		this._transbox.css('width', this._boxWidth);
		this._transbox.css('height', this._boxHeight);

		this.left = (this.model.get('mapWidth') / 2) - (this._boxWidth / 2);
		this.secondLeft = (this.model.get('mapHeight') / 2) - (this._boxHeight / 2);
		this.top = (this.model.get('mapHeight') / 2) - this._border - (this._boxHeight / 2);

		this.translateBox(this.left, this.top);
		this.translateSecondBox(this.secondLeft, this.top);

		//Backing up parameters for mode change
		StimApp.model.set('miniLeft', this.left);
		StimApp.model.set('miniTop', this.top);
		StimApp.model.set('miniBoxWidth', this._boxWidth);
		StimApp.model.set('secondBoxLeft', this.secondLeft);
	},


	renderMiniPOI: function(poiModel) {

		this.$el.append(Mustache.render($('#miniPOITemplate').html(), poiModel));
		var miniPOI = $('[class="miniPOI"][id="' + poiModel.cid + '"]', this.$el);

		//reposition as per the current pitch and heading

		var mapWidth = this.model.get('mapWidth');
		var currhlookat = StimApp.model.get('currhlookat');
		var x = (this.model.get('mapWidth') * (poiModel.heading - currhlookat) / 360) + (this.model.get('mapWidth') / 2); //sibtracting currhlookat to offset the POIs from the center based on the chosen look at angle
		x = (x % mapWidth);
		if (x < 0)
			x = mapWidth + x;
		$(miniPOI).css('left', x + "px");

		var shiftTop = (this.model.get('mapHeight') * (-1 * this._minVLookAt) / this._availableViewAngle); //required for mini pois to be shifted dowm from 0,0 origin position. multiply by -1 for negative values of this._minVLookAt
		var y = ((this.model.get('mapHeight') - (2 * this._border)) * (poiModel.pitch) / this._availableViewAngle) + shiftTop; //subtract (this._poiSize) to center the POI on the mini view
		$(miniPOI).css('top', y + "px");
	},

	deleteMiniPOI: function(poiModel) {
		$('[class="miniPOI"][id="' + poiModel.cid + '"]', this.$el).remove();
	},

	showMiniPOI: function(poiModel) {
		$('[class="miniPOI"][id="' + poiModel.cid + '"]', this.$el).show();
	},

	hideMiniPOI: function(poiModel) {
		$('[class="miniPOI"][id="' + poiModel.cid + '"]', this.$el).hide();
	},

	moveRectangle: function(krpano) {

		if (this._firstFrame) {
			this._firstFrame = false;
			this.repositionDirections();
		}

		var hlookat = krpano.get('view.hlookat');
		var vlookat = krpano.get('view.vlookat');
		var vfov = krpano.get('view.vfov');
		var hfov = krpano.get('view.hfov');
		var mapWidth = this.model.get('mapWidth');
		var mapHeight = this.model.get('mapHeight');

		this.setTransboxPproperties(krpano); //For changing FOV set the new boxWidth and boxHeight
		var boxWidth = this._boxWidth;
		var boxHeight = this._boxHeight;


		step = (hlookat - this._oldhlookat) * mapWidth / 360;

		//correction for center scaling instead of top left corner scaling
		step = step + (this._oldBoxWidth - boxWidth) / 2;

		this.left = this.left + step; //move the box horizontally

		//start logic for this.left from here
		var outerAngle = (boxWidth + (2 * this._border)) * 360 / mapWidth;
		var originalLookAtOffset = (StimApp.model.get('currhlookat') % 360) * mapWidth / 360;
		this.left = ((mapWidth + (2 * boxWidth) + (4 * this._border)) * (hlookat % 360) / (360 + (2 * outerAngle))) + (mapWidth / 2) - (this._boxWidth / 2) - originalLookAtOffset;

		//Wrap logic
		var error = 0;
		if (this.left >= mapWidth) { //subtracting / adding this._border to accomodate for border width
			error = this.left - mapWidth;
			this.left = 0 + error; // works for hlookat > 0 //subtracting / adding this._border to accomodate for border width
		} else if (this.left <= (-1 * boxWidth) - 2 * this._border) { //subtracting / adding this._border to accomodate for border width
			error = this.left - ((-1 * boxWidth) - 2 * this._border);
			this.left = mapWidth - boxWidth - 2 * this._border + error; //subtracting / adding this._border to accomodate for border width
		}

		/*The actual map height is calculated considering that the outer borders  of the transbox don't overshoot the bounding box. 
		Therefore the actual height of the bounding box is (mapHeight - this._border * 4)*/
		var shiftTop = (this.model.get('mapHeight') * (-1 * this._minVLookAt) / this._availableViewAngle); //required for the transbox to be shifted dowm from 0,0 origin position. multiply by -1 for negative values of this._minVLookAt
		//required for panorama clipping to happen properly
		var adjustmentFactor = 1; //change this factor as needed
		this.top = ((mapHeight - (this._border * 2)) * (vlookat % 90) / this._availableViewAngle) + shiftTop - adjustmentFactor - (boxHeight / 2); //subtract this._border * 2 from mapHeight to accomodate for box border
		//to prevent bounce, enable this code
		/*
				if (top > mapHeight - boxHeight)
					top = mapHeight - boxHeight;
				else if (top < 0)
					top = 0;
				*/

		this.translateBox(Number(this.left.toFixed(1)), Number(this.top.toFixed(1)));

		//Second Box Logic

		if (this.left <= 0 && this.left > (-1 * boxWidth) - (2 * this._border) && !this.passLeft) { //subtracting / adding this._border to accomodate for border width
			this.passLeft = true;
			this.passRight = false;
			$(this._secondBox).show();
			error = this.left - 0;
			this.secondLeft = mapWidth + error; //subtracting / adding this._border to accomodate for border width

		} else if (this.left >= ((mapWidth - boxWidth) - (2 * this._border)) && this.left < mapWidth && !this.passRight) { //subtracting / adding -this._border to accomodate box border width
			this.passLeft = false;
			this.passRight = true;
			$(this._secondBox).show();
			error = this.left - ((mapWidth - boxWidth) - (2 * this._border));
			this.secondLeft = ((-1 * boxWidth) - (2 * this._border)) + error;

		} else if (this.left > 0 && this.left < (mapWidth - boxWidth) - (2 * this._border) && (this.passLeft || this.passRight)) { //subtracting / adding -this._border to accomodate box border width
			this.passLeft = false;
			this.passRight = false;
			$(this._secondBox).hide();
		}


		var delta = 0;
		if (this.passLeft || this.passRight) {
			//deploy the second rectangle on the right end
			if (this.passLeft) {
				delta = 0 - this.left;
				this.secondLeft = mapWidth - delta;
			} else if (this.passRight) {
				delta = this.left - ((mapWidth - boxWidth) - (2 * this._border));
				this.secondLeft = ((-1 * boxWidth) - (2 * this._border)) + delta;
			}

			this.translateSecondBox(Number(this.secondLeft.toFixed(1)), Number(this.top.toFixed(1)));
		}

		//Second Box Logic Ends
	},

	translateBox: function(left, top) {
		var transform = "translate(" + left + "px, " + top + "px)";
		$(this._transbox).css({
			"-webkit-transform": transform
		});

		$(this._transbox).css({
			"transform": transform
		});

		$(this._transbox).css({
			'-ms-transform': transform
		});

		$(this._transbox).css({
			'-moz-transform': transform
		});
	},

	translateSecondBox: function(left, top) {
		var transform = "translate(" + left + "px, " + top + "px)";
		$(this._secondBox).css({
			"-webkit-transform": transform
		});

		$(this._secondBox).css({
			"transform": transform
		});

		$(this._secondBox).css({
			'-ms-transform': transform
		});

		$(this._secondBox).css({
			'-moz-transform': transform
		});
	},

	repositionDirections: function() {
		var preshift = 31; // Considering margins and borders for the mini view
		var circleWidth = 15;
		var northAngle = StimApp.model.get("northlookat");
		if (northAngle < 0) {
			northAngle = 360 - (Math.abs(northAngle) % 360);
		} else {
			northAngle = (northAngle % 360)
		}
		var currhlookat = StimApp.model.get('currhlookat') % 360;
		var mapWidth = this.model.get('mapWidth');

		var locationShift = (((northAngle - currhlookat) % 360) * mapWidth / 360) + (mapWidth / 2); //adding mapwidth /2 to shift it wrt to the center
		if (locationShift < 0) {
			locationShift = mapWidth + locationShift;
		}
		var actualShift = (locationShift % mapWidth) + preshift - (circleWidth / 2);
		$(".north").css('left', actualShift + 'px');


		//east
		locationShift = locationShift + (mapWidth / 4);
		actualShift = (locationShift % mapWidth) + preshift - (circleWidth / 2);

		$(".east").css('left', actualShift + 'px');

		//south

		locationShift = locationShift + (mapWidth / 4);
		actualShift = (locationShift % mapWidth) + preshift - (circleWidth / 2);

		$(".south").css('left', actualShift + 'px');


		//west
		locationShift = locationShift + (mapWidth / 4);
		actualShift = (locationShift % mapWidth) + preshift - (circleWidth / 2);

		$(".west").css('left', actualShift + 'px');
	},
});