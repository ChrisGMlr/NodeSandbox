StimApp.Views.CubePOIView = Backbone.View.extend({

	events: {
		'viewRemoved': 'removeDummy',
		'viewMoved': 'moveDummy',
		'setDescriptionZoom': 'displayDescriptionZoom',
		'setRevealZoom': 'displayRevealZoom',
		'dataReady': 'dataIsReady',
	},
	_step: 5,

	defaults: {
		model: StimApp.Models.CubePOIModel,
	},

	initialize: function() {

		//Indicator Button
		var that = this;
		$(this.el).click(function(e) {
			e.stopPropagation();
			that.selectPOI();
			that.showDetails();
		});
		$(this.el).focus(function(e) {
			e.stopPropagation();
			that.selectPOI();
		});
		$(this.el).dblclick(function(e) {
			e.stopPropagation();
			that.toggleForm();
		});
		$('#poiInfoBox').dblclick(function(e) {
			e.stopPropagation();
			that.toggleInfoBox();
		});
		$(this.el).blur(function(e) {
			that.model.set('isSelected', false);
		});
		$(this.el).keydown(function(e) {
			that.editPOI(e);
		});


		//POI Editor Form
		$('#poieditorform', this.el).focus(function(e) {
			e.stopPropagation();
			that.selectPOI();
		});
		$('#poieditorform', this.el).blur(function(e) {
			that.model.set('isSelected', false);
		});
		$('#poieditorform', this.el).keydown(function(e) {
			that.editPOI(e);
		});


		//POI ID
		$('#poieditorid', this.el).on('click focus', function(e) {
			e.stopPropagation(); //preventing the parent element from triggering at the same event
			that.userTyping();
		});
		$('#poieditorid', this.el).on('blur', function(e) {
			that.model.set('isTyping', false);
		});


		//POI Reveal Zoom
		$('#poieditorrevealzoom', this.el).click(function(e) {
			e.stopPropagation();
			that.userTyping();

			that.trigger('setRevealZoom', that);

			that.showRedPoi();
		});

		$('#poieditorrevealzoom', this.el).focus(function(e) {
			e.stopPropagation();
			that.userTyping();
		});

		that.listenTo(that.model, 'change:revealZoom', function(e) {
			$('#revealzoomdisplay', this.el).text(e.get('revealZoom'));
		});

		$('#poieditorrevealzoom', this.el).blur(function(e) {
			that.model.set('isSaving', false);
		});


		//POI Description Zoom
		$('#poieditordescriptionzoom', this.el).click(function(e) {
			e.stopPropagation();
			that.userTyping();

			that.trigger('setDescriptionZoom', that);

			that.showRedPoi();
		});

		$('#poieditordescriptionzoom', this.el).focus(function(e) {
			e.stopPropagation();
			that.userTyping();
		});

		that.listenTo(that.model, 'change:descriptionZoom', function(e) {
			$('#descriptionzoomdisplay', this.el).text(e.get('descriptionZoom'));
		});

		$('#poieditordescriptionzoom', this.el).blur(function(e) {
			that.model.set('isSaving', false);
		});

		//POISave Button

		$('#poieditorsave', this.el).click(function(e) {
			e.stopPropagation();
			that.userSaving();

			that.setAllAttributesToModel();
		});

		$('#poieditorsave', this.el).focus(function(e) {
			e.stopPropagation();
			that.userSaving();

		});

		$('#poieditorsave', this.el).blur(function(e) {
			that.model.set('isSaving', false);
		});

		StimApp.model.trigger('positionMiniPOI', this.model);
	},
	removePOI: function() {
		this.$el.off();
		this.$el.children().off();
		this.clearPrivateVariables();
		// COMPLETELY UNBIND THE VIEW
		this.undelegateEvents();

		this.$el.removeData().unbind();

		// Remove view from DOM
		Backbone.View.prototype.remove.call(this);

		Backbone.View.prototype.remove.apply(this, arguments);
	},

	clearPrivateVariables: function() {
		delete this._step;
		this.initializePrivateVariables();
	},

	initializePrivateVariables: function() {
		this._step = 5;
	},

	render: function(parent) {
		$(parent).append(this.el);

		var that = this;
		//Setting fields
		var id = this.model.get('id');
		var descriptionZoom = this.model.get('descriptionZoom');
		var revealZoom = this.model.get('revealZoom');


		if (!id || !descriptionZoom || !revealZoom)
			return;

		$('#poieditorid', this.el).val(id);
		//Setting ID to not editable for non empty or non null values.
		if (!_.isNull(id)) {
			$('#poieditorid', this.el).prop("readonly", true);
			$('#poieditorid', this.el).addClass("readonly");

			//Turning off focus and blur event listeners
			$('#poieditorid', this.el).off();
		}

		$('#descriptionzoomdisplay', this.el).text(descriptionZoom);

		$('#revealzoomdisplay', this.el).text(revealZoom);

		this.showGreenPoi();

		//hide the form initially
		this.toggleForm();

		if (StimApp.model.get('currentCategory') == 'all')
			this.showPOI();
		else if ($.inArray(StimApp.model.get('currentCategory'), this.model.get('categories')) === -1)
			this.hidePOI();
		else
			this.showPOI();

	},

	editPOI: function(e) {
		//Delete should delete the POI only when the user is not typing in the text field
		if (this.model.get('isSelected') && !this.model.get('isTyping')) {
			//127 is the ASCII code for del button
			var left = this.model.leftTranslate;
			var top = this.model.topTranslate;

			if (e.which == 46) {
				this.model.set('isSelected', false);
				this.model.set('isTyping', false);
				this.model.set('isSaving', false);
				this.remove();
			} else {
				if (e.which == 37) {
					//left
					left -= this._step;
					this.updatePosition(left, top);
				}

				if (e.which == 38) {
					//up
					top -= this._step;
					this.updatePosition(left, top);
				}

				if (e.which == 39) {
					//right
					left += this._step;
					this.updatePosition(left, top);
				}

				if (e.which == 40) {
					//down
					top += this._step;
					this.updatePosition(left, top);
				}
			}
		}
	},

	remove: function() {
		if (window.confirm("Are you sure you want to delete the POI?")) {

			this.trigger('viewRemoved', this);

			//Delete POI from miniView
			StimApp.model.trigger('deleteMiniPOI', this.model);

			this.clearPrivateVariables();
			this.removePOI();
		}
	},

	showGreenPoi: function() {
		$(this.el).removeClass('unsavedPoi').addClass('savedPoi');
	},

	showRedPoi: function() {
		$(this.el).removeClass('savedPoi').addClass('unsavedPoi');
	},

	updatePosition: function(left, top) {
		this.model.leftTranslate = left;
		this.model.topTranslate = top;

		this.trigger('viewMoved', this);

		this.showRedPoi();
		//To update the position of the mini POI
		StimApp.model.trigger('positionMiniPOI', this.model);
	},

	selectPOI: function() {
		this.model.set('isTyping', false);
		this.model.set('isSelected', true);
		this.model.set('isSaving', false);

		StimApp.model.set('selectedCubePOI', this.cid);
	},

	userTyping: function() {

		this.model.set('isTyping', true);
		this.model.set('isSelected', false);
		this.model.set('isSaving', false);

		this.showRedPoi();

	},

	userSaving: function() {
		this.model.set('isTyping', false);
		this.model.set('isSelected', false);
		this.model.set('isSaving', true);
	},

	toggleForm: function() {
		if ($('#poieditorform', this.el).is(":visible")) {
			$('#poieditorform', this.el).css("display", "none");
		} else {
			$('#poieditorform', this.el).css("display", "block");
			this.showDetails();
		}
	},

	setAllAttributesToModel: function() {
		var id = $('#poieditorid', this.el).val();
		var heading = this.model.heading;
		var pitch = this.model.pitch;
		var revealZoom = this.model.get('revealZoom');
		var descriptionZoom = this.model.get('descriptionZoom');

		//Null Check :: The expression evaluates to true if any of the below fields caontain a falsy value (null, '', false, undefined, 0, NaN). Therefore it won't work if the value is 0;
		if (!id || !heading || !pitch || !revealZoom || !descriptionZoom)
			return;

		this.model.set('id', id);
		//Set the ID to readyonly once saved
		if (!_.isNull(id)) {
			$('#poieditorid', this.el).prop("readonly", true);
			$('#poieditorid', this.el).addClass("readonly");

			//Turning off focus and blur event listeners
			$('#poieditorid', this.el).off();
		}

		//If it is day, set the poi heading, pitch and zoom Values for both day and night.. Otherwise, set it for only night. This is to reduce the burden of setting up pois twice for day and night modes
		if (StimApp.model.get('currMode') == 'day') {

			//setting day attributes
			this.model.set('headingDay', heading);
			this.model.set('pitchDay', pitch);
			this.model.set('revealZoomDay', revealZoom);
			this.model.set('descriptionZoomDay', descriptionZoom);

			//setting night attributes
			//save position data for night view only if the POIs are freshly added
			if (this.model.get('newPOI')) {
				this.model.set('newPOI', false);
				this.model.set('headingNight', heading);
				this.model.set('pitchNight', pitch);
				this.model.set('revealZoomNight', revealZoom);
				this.model.set('descriptionZoomNight', descriptionZoom);
			}

		} else if (StimApp.model.get('currMode') == 'night') {
			//setting night attributes
			this.model.set('headingNight', heading);
			this.model.set('pitchNight', pitch);
			this.model.set('revealZoomNight', revealZoom);
			this.model.set('descriptionZoomNight', descriptionZoom);

			if (this.model.get('newPOI')) {
				this.model.set('newPOI', false);
				this.model.set('headingDay', heading);
				this.model.set('pitchDay', pitch);
				this.model.set('revealZoomDay', revealZoom);
				this.model.set('descriptionZoomDay', descriptionZoom);
			}
		}


		this.showGreenPoi();

		this.trigger('dataReady', this);
	},

	showPOI: function() {
		this.model.set('isHidden', false);
		StimApp.model.trigger('showMiniPOI', this.model);

		this.$el.show();
	},

	hidePOI: function() {
		this.model.set('isHidden', true);
		StimApp.model.trigger('hideMiniPOI', this.model);

		this.$el.hide();
	},

	showDetails: function() {
		//EditorPanel
		$('#poiInfoBox').children().remove();
		$('#poiInfoBox').append(Mustache.render($('#editorDetails').html(), this.model.attributes));
		$('#poiEditorImages').text("#Images : " + this.model.get('images').length);
		$('#poiInfoBox').show();

	},

	toggleInfoBox: function() {
		$('#poiInfoBox').toggle();
	},
});