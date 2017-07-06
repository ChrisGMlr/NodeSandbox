StimApp.Models.CategoriesCollection = Backbone.Collection.extend({
	_categories: null,
	categories: [],

	defaults: {
		model: StimApp.Models.CategoryModel,

	},

	constructor: function(categories) {
		Backbone.Collection.apply(this);
		this._categories = categories.en; //default is en
	},

	setCategories: function() {
		var that = this;

		_.each(that._categories, function(c) {
			that.add(new StimApp.Models.CategoryModel({
				categoryName: c.name,
				id: c.id,
				categories: that.categories
			}));
		});
	},

	resetCategories: function() {
		var that = this;

		//destroy previous models
		//empty the collection
		this.reset();

		//readd  models with new language
		this.setCategories();
	},

	setCategoryArray: function() {
		var that = this;
		that.categories = [];
		//Add an array of all categories for rendering them out hidden thereby creating the div with longest width
		_.each(that._categories, function(c) {
			that.categories.push(c);
		});
	},

	resetCategoryArray: function() {
		this._categories = StimApp.model.get("currentStrings").categories;

		var that = this;
		that.categories = [];
		//Add an array of all categories for rendering them out hidden thereby creating the div with longest width
		_.each(that._categories, function(c) {
			that.categories.push(c);
		});
	}
});