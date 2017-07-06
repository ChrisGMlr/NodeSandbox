StimApp.Models.StringsModel = Backbone.Model.extend({
	_strings: null,
	currentStrings: [],


	constructor: function(languages, uistrings) {
		Backbone.Model.apply(this);
		this._strings = uistrings;

		for (var i in languages) {
			this.setCurrentStrings(languages[i].id);
		}
	},

	setCurrentStrings: function(language) {
		var that = this;
		var s = {};
		for (var i in this._strings) {
			s[i] = this._strings[i][language];
		}

		this.currentStrings[language] = s;
	},
});