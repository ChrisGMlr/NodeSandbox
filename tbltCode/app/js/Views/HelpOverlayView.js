StimApp.Views.HelpOverlayView = Backbone.View.extend({

    defaults: {
        model: StimApp.Models.HelpOverlayModel,
    },

    initialize: function() {
        //this.$el.toggle(false); //Hide the overlay when the app starts
        var that = this;
        this.fadeOutHelp();
        this.render();
        this.listenTo(StimApp.model, 'change:isInHelp', this._toggleHelpOverlay);
        this.listenTo(StimApp.model, 'change:currentStrings', this.render);
        this.listenTo(StimApp.model, 'timeOut', this.fadeOutHelp);
        this.listenTo(StimApp.model, 'backToNormal', function() {
            if (StimApp.model.get('isInHelp'))
                that.fadeInHelp();
        });
        this.listenTo(StimApp.model, 'resetDefaults', this.resetHelp);
        var boundFunction = _.bind(this._onHelpOverlayClicked, this);
        this.$el.on("pointerup", boundFunction);
    },

    _toggleHelpOverlay: function() {
        // this.$el.toggle(StimApp.model.get('isInHelp'));
        if (this.$el.hasClass('inactive'))
            this.fadeInHelp();
        else
            this.fadeOutHelp();

        this.calculateHelpTextPosition();
    },

    _onHelpOverlayClicked: function(e) {
        if (e !== null && e !== undefined) {
            e.stopPropagation();
            e.preventDefault();
        }
        // if (e !== null && e !== undefined) {
        //     if (e.type == 'touchstart') {
        ampm.logEvent('ui', 'help', 'exit'); //Analytics
        //     }
        // }
        //StimApp.model.set('isInHelp', !StimApp.model.get('isInHelp'));
        StimApp.model.set('isInHelp', !StimApp.model.get('isInHelp'));
        // this.$el.toggle(StimApp.model.get('isInHelp'));
        this.fadeOutHelp();

        $('#helpButton').removeClass('buttonPress');
        //this.closeButtonToggle();
    },

    render: function() {
        var that = this;
        this.$el.children().remove(); //Remove all child elements and rerender
        that.$el.append(Mustache.render($('#toolTipTemplate').html(), StimApp.model.get('currentStrings')));
        this.resetActions();
    },

    resetActions: function() {
        $('#helpOverlayView', this.el).on('pointerup pointerdown pointermove', function(e) {
            StimApp.model.resetTimer();
        });
    },


    calculateHelpTextPosition: function() {
        //Modes Help Text
        //var offset = $('#modesDropDown').offset();
        //var width = $('#modesDropDown').outerWidth();

        //$('#modesHelpText').css('width', width);
        //var textHeight = $('#modesHelpText').outerHeight();
        // $('#modesHelpText').css('top', offset.top - textHeight - 22); //subract 
        //$('#modesHelpText').css('left', offset.left);


        //Categories Help Text
        offset = $('#categoriesDropDown').offset();
        width = $('#categoriesDropDown').outerWidth();

        $('#categoriesHelpText').css('width', width);
        textHeight = $('#categoriesHelpText').outerHeight();
        $('#categoriesHelpText').css('top', offset.top - textHeight - 40); //subract 
        $('#categoriesHelpText').css('margin-left', 730); //the left value is 20 since the margin-left for the relatively positioned categoriesView is 20px


        //Mini View Help Text
        //offset = $('#miniView').offset();
        //width = $('#miniView').width();

        // $('#miniViewHelpText').css('width', width);
        // textHeight = $('#miniViewHelpText').outerHeight();
        // $('#miniViewHelpText').css('top', offset.top - textHeight); //do not subtract 22 for this one so as to align it with the remaining divs
        // $('#miniViewHelpText').css('left', offset.left + 50); //the left value is 20 since the margin-right for the relatively positioned categoriesView is 20px

        //Reset View Help Text
        offset = $('#resetButton').offset();
        width = $('#resetButton').outerWidth();

        $('#resetButtonHelpText').css('width', width);
        textHeight = $('#resetButtonHelpText').outerHeight();
        $('#resetButtonHelpText').css('top', offset.top - textHeight - 40); //subract
        $('#resetButtonHelpText').css('left', offset.left); //the left value is 20 since the margin-right for the relatively positioned categoriesView is 20px

        //Language View Help Text
        // if (StimApp.model.get('hasMultipleLanguages')) {
        //     offset = $('#languagesDropDown').offset();
        //     width = $('#languagesDropDown').outerWidth();

        //     $('#languagesHelpText').css('width', width);
        //     textHeight = $('#languagesHelpText').outerHeight();
        //     $('#languagesHelpText').css('top', offset.top - textHeight - 22); //subract 
        //     $('#languagesHelpText').css('margin-right', 20); //the left value is 20 since the margin-right for the relatively positioned categoriesView is 20px
        // } else {
        //     $('#languagesHelpText').css('display', 'none');
        // }
    },

    closeButtonToggle: function() {
        if ($('#helpButton').is(':visible')) {
            $('#helpButton').css('display', 'none');
            $('#closeButton').css('display', 'inline');
        } else {
            $('#helpButton').css('display', 'inline');
            $('#closeButton').css('display', 'none');
        }

    },

    fadeOutHelp: function() {
        this.$el.addClass('inactive');
    },

    fadeInHelp: function() {
        this.$el.removeClass('inactive');
    },

    resetHelp: function() {
        if (StimApp.model.get('isInHelp')) {
            this._onHelpOverlayClicked();

            //explicitly set the button to display help instead of close. This is necessary because, language change causes closeButtonToggle to be called twice
            $('#helpButton').css('display', 'inline');
            $('#closeButton').css('display', 'none');
        }
    },

});