StimApp.Models.AttractModel = Backbone.Model.extend({
	defaults: {
		locations: null,
	},

	constructor: function(attractLocations) {
		Backbone.Model.apply(this);
		this.set('locations', attractLocations);
	},
});