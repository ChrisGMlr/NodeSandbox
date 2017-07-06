StimApp.Models.ControlsModel = Backbone.Model.extend({

	_modeModel: null,
	_categoryModel: null,
	_miniModel: null,
	_resetModel: null,
	_helpModel: null,


	defaults: {
		isHidden: null, //To show or hide all controls
		categoriesCollection: null,
		modesCollection: null,
		miniModel: null,
		resetModel: null,
		helpModel: null
	},

	constructor: function(categories, modes, modesSubText, pointsOfInterest, defaulthlookat, defaultvlookat) {
		Backbone.Model.apply(this);
		//this.set('modesCollection', new StimApp.Models.ModesCollection(modes, modesSubText));
		this.set('categoriesCollection', new StimApp.Models.CategoriesCollection(categories));
		//this.set('miniModel', new StimApp.Models.MiniModel(pointsOfInterest, defaulthlookat, defaultvlookat));
		this.set('resetModel', new StimApp.Models.ResetModel());
		this.set('helpModel', new StimApp.Models.HelpModel());
	},
});