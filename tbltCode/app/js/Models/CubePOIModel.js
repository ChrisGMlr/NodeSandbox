StimApp.Models.CubePOIModel = Backbone.Model.extend({

	leftTranslate: null,
	topTranslate: null,
	anchorPoint: null,
	heading: null,
	pitch: null,
	containerHeight: null,
	width: null,
	height: null,

	defaults: {
		isTyping: false,
		isSelected: false,
		isSaving: false,

		id: null,
		title: null,
		description: null,
		images: [],
		categories: null,
		modes: null,
		isSurpriseSpot: false,


		headingDay: null,
		pitchDay: null,
		revealZoomDay: null,
		descriptionZoomDay: null,

		headingNight: null,
		pitchNight: null,
		revealZoomNight: null,
		descriptionZoomNight: null,


		revealZoom: null,
		descriptionZoom: null,

		isHidden: false, //Used to filter based on categories

		newPOI: false, //used to differentiate between freshly added pois and pois that were already in the json file
	},

	constructor: function(positionX, positionY, heading, pitch, anchorPoint) {
		Backbone.Model.apply(this);
		this.leftTranslate = positionX;
		this.topTranslate = positionY;
		this.heading = heading;
		this.pitch = pitch;
		this.anchorPoint = anchorPoint;
	},
});