StimApp.Models.ModesCollection = Backbone.Collection.extend({
	_modes: null,
	modes: [],
	modesSubText: null,

	constructor: function(modes, modesSubText) {
		Backbone.Collection.apply(this);
		this._modes = modes.en; //default is en
		this.modesSubText = modesSubText.en;
	},

	setModes: function() {
		var that = this;
		_.each(that._modes, function(c) {
			that.add(new StimApp.Models.ModeModel({
				modeName: c.name,
				id: c.id,
				modes: that.modes
			}));
		});
	},

	resetModes: function() {
		var that = this;

		//empty the collection
		this.reset();

		//readd  models with new language
		this.setModes();
	},

	setModesArray: function() {
		var that = this;
		that.modes = [];
		//Add an array of all categories for rendering them out hidden thereby creating the div with longest width
		_.each(that._modes, function(c) {
			that.modes.push(c);
		});
	},

	resetModesArray: function() {
		this._modes = StimApp.model.get("currentStrings").modes;
		this.modesSubText = StimApp.model.get("currentStrings").modesSubText;


		var that = this;
		that.modes = [];
		//Add an array of all categories for rendering them out hidden thereby creating the div with longest width
		_.each(that._modes, function(c) {
			that.modes.push(c);
		});
	}
});