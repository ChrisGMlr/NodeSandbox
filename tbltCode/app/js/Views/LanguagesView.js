StimApp.Views.LanguagesView = Backbone.View.extend({

    _mousedown: false,
    _mousedownMenu: false,

    defaults: {
        model: StimApp.Models.LanguagesCollection,
    },

    initialize: function() {
        this.model.setLanguageArray(); //This is required to append all divs to the base div for sizing
        this.render();
        this.listenTo(this.model, 'add', this.addLanguagesToDropDown);
        this.model.setLanguages();
        this.selectDefaultLanguage(StimApp.model.get('currentLanguage'));
        this.setActions();
        this.listenTo(StimApp.model, 'resetDefaults resetDefaultLanguage', this.resetLanguage);
    },

    setDropDownValue: function(value) {
        // get the selection
        $('.selectedDiv img', this.el).attr('src', value);
    },

    selectDefaultLanguage: function(languageID) {
        var languagesCollection = this.model;
        var defaultLanguageModel = this.getModelFromID(languageID);
        this.setDropDownValue(defaultLanguageModel.get('image'));
        this.shadeSelectedOption(languageID);
    },

    getModelFromID: function(id) {
        var languageModel = this.model.find(function(model) {
            return model.get('id') == id;
        });
        return languageModel;
    },
    addLanguagesToDropDown: function(mode) {
        var select = $('.languageList', this.$el);
        select.append(Mustache.render($('#languageTemplate').html(), mode.attributes));
    },

    render: function() {
        this.$el.children().remove();
        this.$el.append(Mustache.render($('#languagesTemplate').html(), this.model));
    },

    shadeSelectedOption: function(optionID) {
        //unshade all  options
        $('.languageOption').each(function(index, value) {
            $(this).removeClass('buttonPress');
            $(this).removeClass('selectedOption');
        });

        //shade the selected option
        $('.actualOption #' + optionID).addClass('selectedOption');
    },

    setActions: function() {
        var that = this;

        $('#languagesDropDown, .languageOption').off();

        //Open close the drop down
        $('#languagesDropDown', this.el).on('pointerup', function(e) {
            if (!that._mousedownMenu)
                return;

            that._mousedownMenu = false;
            $('.languageList', that.el).toggleClass('active');
            that.toggleArrows();
        });

        $('#languagesDropDown', this.el).on('pointerup pointerleave', function(e) {
            if (e.type == 'pointerleave')
                that._mousedownMenu = false;
            //Mouse up remove highlight
            $('.transborder', that.el).removeClass('buttonPress');
            $('.actualSelect .dropUpArrow polygon', that.el).attr('fill', 'white');
            $('.actualSelect .dropDownArrow polygon', that.el).attr('fill', 'white');
        });


        //Mouse down highlight
        $('#languagesDropDown', this.el).on('pointerdown', function(e) {
            that._mousedownMenu = true;
            $('.transborder', that.el).addClass('buttonPress');
            $('.actualSelect .dropUpArrow polygon', that.el).attr('fill', 'black');
            $('.actualSelect .dropDownArrow polygon', that.el).attr('fill', 'black');
        });

        //Mousedown change background for options
        $('.languageOption', this.el).on('pointerdown', function(e) {
            e.stopPropagation();
            that._mousedown = true;
            $(e.target).removeClass('selectedOption');

            $(e.target).addClass('buttonPress');
        });

        $('.languageOption', this.el).on('pointerup pointerleave', function(e) {
            e.stopPropagation();

            if (e.type == 'pointerleave')
                that._mousedown = false;

            var id = $(e.target).attr('id');
            if (id == StimApp.model.get('currentLanguage')) {
                $(e.target).addClass('selectedOption');
                return;
            }

            $(e.target).removeClass('buttonPress');
        });


        //Select option
        var optionID = null;
        var optionValue = null;

        $('.languageOption', this.el).on('pointerup', function(e) {
            e.stopPropagation();
            if (!that._mousedown)
                return;

            that._mousedown = false;

            optionID = $(e.target).attr('id');
            optionValue = that.getModelFromID(optionID).get('image'); //retrieve the image path from the optionID

            //changing the value in AppModel to fire other events
            if (optionID === null || optionID === undefined)
                return;

            StimApp.model.set('currentLanguage', optionID);

            // ampm.logEvent('kiosk' + StimApp.model.get('kioskNumber'), 'language', optionID); //Analytics

            that.setDropDownValue(optionValue);
            that.shadeSelectedOption(optionID);

            //Close the dropdown
            $('.languageList', that.el).toggleClass('active');
            that.toggleArrows();
        });

        //Click outside event
        document.body.addEventListener('pointerup', function(e) {
            var container = $(that.el);

            if (!container.is(e.target) && container.has(e.target).length === 0) // if the target of the click isn't the container...// ... nor a descendant of the container
            {
                that.hideOptions();
            }
        });
    },

    hideOptions: function() {
        var that = this;
        $('.languageList', that.el).removeClass('active');
        $('.dropDownArrow', that.el).hide();
        $('.dropUpArrow', that.el).show();
    },

    toggleArrows: function() {
        $('.dropDownArrow', this.el).toggle();
        $('.dropUpArrow', this.el).toggle();
    },


    resetLanguage: function() {
        StimApp.model.set('currentLanguage', 'en');
        this.selectDefaultLanguage('en');
    },

});