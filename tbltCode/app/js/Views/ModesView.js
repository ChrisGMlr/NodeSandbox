StimApp.Views.ModesView = Backbone.View.extend({


    _mousedown: false,
    _mouseDownMenu: false,

    defaults: {
        model: StimApp.Models.ModesCollection,
    },

    initialize: function() {
        var that = this;
        this.model.setModesArray(); //This is required to append all divs to the base div for sizing
        this.render();
        this.listenTo(this.model, 'add', this.addModesToDropDown);
        this.model.setModes();
        this.selectDefaultMode(StimApp.model.get('currMode'));
        this.listenTo(StimApp.model, 'change:currentStrings onloadcomplete', this.reRender);
        this.listenTo(StimApp.model, 'resetDefaults', this.resetDefaultMode);


        this.setActions();
        this.resetActions();
    },

    setDropDownValue: function(value) {
        // get the selection
        $('.selectedDiv .mainText', this.el).text(value);
    },

    resetDropDownValue: function() {
        var that = this;
        this.model.each(function(mode) {
            if (mode.get('id') === StimApp.model.get('currMode')) {
                that.setDropDownValue(mode.get('modeName'));
            }
        });
    },
    addModesToDropDown: function(mode) {
        var select = $('.modeList', this.el);
        select.append(Mustache.render($('#modeTemplate').html(), mode.attributes));
    },

    selectDefaultMode: function(modeID) {
        var modeCollection = this.model;
        var defaultModeModel = modeCollection.find(function(model) {
            return model.get('id') == modeID;
        });

        this.setDropDownValue(defaultModeModel.get('modeName'));
        this.shadeSelectedOption(modeID);
    },

    render: function() {
        this.$el.children().remove();
        this.$el.append(Mustache.render($('#modesTemplate').html(), this.model));
    },

    reRender: function() {
        //Clear View
        this.$el.children().remove();

        //Reset the modesArray with the options from newLanguage,
        this.model.resetModesArray();

        //Rerender select
        this.$el.append(Mustache.render($('#modesTemplate').html(), this.model));

        //ResetModel
        this.model.resetModes();
        //Resetting the modes, will call the addModesToDropDown method

        this.setActions();

        this.resetDropDownValue();
        this.shadeSelectedOption(StimApp.model.get('currMode'));
        this.resetActions();
    },

    resetActions: function() {
        $('#modesDropDown .transborder, .modeOption', this.el).on('pointerup pointerdown pointermove', function(e) {
            StimApp.model.resetTimer();
        });
    },

    shadeSelectedOption: function(optionID) {
        //unshade all  options
        $('.modeOption').each(function(index, value) {
            $(this).removeClass('buttonPress');
            $(this).removeClass('selectedOption');

            $(this).find('.optionLabel').css('color', 'white');

            $(this).find('.optionLabel div').removeClass('optionSelected');
        });

        //shade the selected option
        $('.actualOption #' + optionID).addClass('selectedOption');
        $('.actualOption #' + optionID).find('.optionLabel').css('color', 'black');
        $('.actualOption #' + optionID).find('.optionLabel div').addClass('optionSelected');
    },

    setActions: function() {
        var that = this;

        $('#modesDropDown, .modeOption').off();

        //Open close the drop down
        $('#modesDropDown', this.el).on('pointerup', function(e) {
            if (!that._mousedownMenu)
                return;

            that._mousedownMenu = false;
            $('.modeList', that.el).toggleClass('active');
            that.toggleArrows();
        });

        $('#modesDropDown', this.el).on('pointerup pointerleave', function(e) {
            if (e.type == "pointerleave")
                that._mousedownMenu = false;
            //Mouse up remove highlight
            $('.transborder', that.el).removeClass('buttonPress');
            $('.actualSelect .dropUpArrow polygon', that.el).attr('fill', 'white');
            $('.actualSelect .dropDownArrow polygon', that.el).attr('fill', 'white');
        });

        //Mouse down highlight
        $('#modesDropDown', this.el).on('pointerdown', function(e) {
            that._mousedownMenu = true;
            $('.transborder', that.el).addClass('buttonPress');
            $('.actualSelect .dropUpArrow polygon', that.el).attr('fill', 'black');
            $('.actualSelect .dropDownArrow polygon', that.el).attr('fill', 'black');
        });

        //Mousedown change background for options
        $('.modeOption', this.el).on('pointerdown', function(e) {
            e.stopPropagation();
            that._mousedown = true;

            $(e.target).removeClass('selectedOption');

            $(e.target).addClass('buttonPress');
            $(e.target).find('.optionLabel').css('color', 'black');

            $(e.target).find('.optionLabel div').addClass('optionSelected');
        });

        $('.modeOption', this.el).on('pointerup pointerleave', function(e) {
            e.stopPropagation();

            if (e.type == "pointerleave")
                that._mousedown = false;

            var id = $(e.target).attr('id');
            if (id == StimApp.model.get('currMode')) {
                $(e.target).addClass('selectedOption');
                return;
            }

            $(e.target).removeClass('buttonPress');
            $(e.target).find('.optionLabel').css('color', 'white');

            $(e.target).find('.optionLabel div').removeClass('optionSelected');
        });

        //Select option
        var optionID = null;
        var optionValue = null;

        $('.modeOption', this.el).on('pointerup', function(e) {
            e.stopPropagation();

            if (!that._mousedown)
                return;

            that._mousedown = false;

            optionID = $(e.target).attr('id');
            optionValue = $(e.target).text();

            //changing the value in AppModel to fire other events
            if (optionID === null || optionID === undefined)
                return;

            StimApp.model.set('currMode', optionID);

            // ampm.logEvent('kiosk' + StimApp.model.get('kioskNumber'), 'selectImage', optionID); //Analytics

            that.setDropDownValue(optionValue);
            that.shadeSelectedOption(optionID);

            //Close the dropdown
            $('.modeList', that.el).toggleClass('active');
            that.toggleArrows();
        });

        //Click outside event
        $(document).on('pointerup', function(e) {
            var container = $(that.el);

            if (!container.is(e.target) && container.has(e.target).length === 0) // if the target of the click isn't the container...// ... nor a descendant of the container
            {
                that.hideOptions();
            }
        });

    },

    hideOptions: function() {
        var that = this;
        $('.modeList', that.el).removeClass('active');
        $('.dropDownArrow', that.el).hide();
        $('.dropUpArrow', that.el).show();
    },

    toggleArrows: function() {
        $('.dropDownArrow', this.el).toggle();
        $('.dropUpArrow', this.el).toggle();
    },

    resetDefaultMode: function() {
        StimApp.model.set('currMode', 'day');
        this.selectDefaultMode('day');
    },

});