StimApp.Views.ControlsView = Backbone.View.extend({


	_modesView: null,
	_categoriesView: null,
	_miniView: null,
	_resetView: null,
	_helpView: null,


	initialize: function() {
		model = StimApp.Views.ControlsView;
		this.render();

		this._categoriesView = new StimApp.Views.CategoriesView({
			model: this.model.get('categoriesCollection'),
			el: $('#categoriesView', this.$el)
		});
		/*
				if (StimApp.model.get('hasMultipleModes')) {
					this._modesView = new StimApp.Views.ModesView({
						model: this.model.get('modesCollection'),
						el: $('#modesView', this.$el)
					});
				}

				this._miniView = new StimApp.Views.MiniView({
					model: this.model.get('miniModel'),
					el: $('#miniView', this.$el)
				});
		*/
		this._resetView = new StimApp.Views.ResetView({
			model: this.model.get('resetModel'),
			el: $('#resetView', this.$el)
		});

		this._helpView = new StimApp.Views.HelpView({
			model: this.model.get('helpModel'),
			el: $('#helpView', this.$el)
		});

		isHidden = false; //keep it hidden by default

		this.listenTo(StimApp.model, 'timeOut', this.fadeOutControls);
		this.listenTo(StimApp.model, 'backToNormal', this.fadeInControls);
		this.listenTo(StimApp.model, 'endAttract', this.fadeInControls);
		this.listenTo(StimApp.model, 'resetComplete', this.fadeInControls);

		this.listenTo(StimApp.model, 'change:currMode', this.fadeOutControls);
		this.listenTo(StimApp.model, 'onloadcomplete', function() {
			if (!StimApp.model.get('startingAttract'))
				this.fadeInControls();
		});

		this.fadeOutControls();
	},

	render: function(data) {
		this.$el.append(Mustache.render($('#controlsTemplate').html(), this.model.toJSON()));
		return this;
	},

	fadeOutControls: function() {
		this.$el.addClass('inactive');
	},

	fadeInControls: function() {
		this.$el.removeClass('inactive');
	},
});