StimApp.Models.POIModel = Backbone.Model.extend({

	leftTranslate: null,
	topTranslate: null,
	anchorPoint: null,
	heading: null,
	pitch: null,

	defaults: {
		isTyping: false,
		isSelected: false,
		isSaving: false,

		id: null,
		title: null,
		titles: null,
		description: null,
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

		isHidden: false, //isHidden is true if the POI should be visible for a given FOV and vice versa. This value is used for category / mode filtering and revel zoom filtering

		//File names for normal and pressed state for icons
		catIcon: null,
		catIconPressed: null,
		normalIcon: null,
		pressedIcon: null,
		dotIcon: null,
		backCrossIcon: null,
		backButton: null,
		crossButton: null,
		media: null,

		caseStudies: null,
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