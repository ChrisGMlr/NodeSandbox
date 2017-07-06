StimApp.Models.LanguagesCollection = Backbone.Collection.extend({
	_languages: null,
	languages: [],

	defaults: {
		model: StimApp.Models.LanguageModel,
		defaultLanguage: null,
	},

	constructor: function(languages) {
		Backbone.Collection.apply(this);
		this._languages = languages;
	},

	setLanguages: function() {
		var that = this;
		_.each(that._languages, function(c) {
			that.add(new StimApp.Models.LanguageModel({
				language: c.language,
				id: c.id,
				image: c.image,
				languages: that.languages
			}));
		});
	},

	resetLanguages: function() {
		var that = this;

		//destroy previous models
		//empty the collection
		this.reset();

		//readd  models with new language
		this.setLanguages();
	},

	setLanguageArray: function() {
		var that = this;
		that.languages = [];
		//Add an array of all languages for rendering them out hidden thereby creating the div with longest width
		_.each(that._languages, function(c) {
			that.languages.push(c);
		});
	},

	resetLanguageArray: function() {
		this._languages = StimApp.model.get("currentStrings").languages;

		var that = this;
		that.languages = [];
		//Add an array of all categories for rendering them out hidden thereby creating the div with longest width
		_.each(that._languages, function(c) {
			that.languages.push(c);
		});
	}
});