StimApp.Views.CategoriesView = Backbone.View.extend({

    _categories: null,
    _modelIndex: 0,
    _template: '',
    tagName: 'div',
    _mousedown: false,
    _mouseDownMenu: false,

    defaults: {
        model: StimApp.Models.CategoriesCollection
    },

    initialize: function() {
        this.model.setCategoryArray(); //This is required to append all divs to the base div for sizing
        this.render();
        this.listenTo(this.model, 'add', this.addCategoriesToDropDown);
        this.model.setCategories();
        this.selectDefaultCategory(StimApp.model.get('currentCategory'));
        this.listenTo(StimApp.model, 'change:currentStrings onloadcomplete', this.reRender);
        this.listenTo(StimApp.model, 'resetDefaults', this.resetCategories);
        this.listenTo(StimApp.model, 'resetHit', this.resetCategories);

        //this.el = this._template.html() + "/div #categoriesView/select";
        this.setActions();
        this.resetActions();
    },

    setDropDownValue: function(value) {
        // get the selection
        $('.selectedDiv .mainText', this.el).text(value);
    },

    resetDropDownValue: function() {
        var that = this;
        this.model.each(function(category) {
            if (category.get('id') === StimApp.model.get('currentCategory')) {
                that.setDropDownValue(category.get('categoryName'));
            }
        });
    },

    selectDefaultCategory: function(categoryID) {
        var categoriesCollection = this.model;
        var defaultCategoryModel = categoriesCollection.find(function(model) {
            return model.get('id') == categoryID;
        });

        this.setDropDownValue(defaultCategoryModel.get('categoryName'));
        this.shadeSelectedOption(categoryID);
    },

    addCategoriesToDropDown: function(category) {
        var select = $('.categoryList', this.el);
        select.append(Mustache.render($('#categoryTemplate').html(), category.attributes));
    },

    render: function() {
        this.$el.children().remove();
        this.$el.append(Mustache.render($('#categoriesTemplate').html(), this.model));
        if (!StimApp.model.get('hasMultipleModes'))
            this.$el.css('margin-left', '20px');

        //adding border radius for top most and bottom most category option
        $('.categoryList div:nth-child(1) .actualOption .categoryOption', this.el).css('border-radius', '5px 5px 0px 0px');
        $('.categoryList div:nth-child(' + this.model.length + ') .actualOption .categoryOption', this.el).css('border-radius', '0px 0px 5px 5px');
    },

    reRender: function() {
        //Clear View
        this.$el.children().remove();

        //Reset the categoryArray with the options from newLanguage,
        this.model.resetCategoryArray();

        //Rerender select
        this.$el.append(Mustache.render($('#categoriesTemplate').html(), this.model));

        //ResetModel
        this.model.resetCategories();
        this.setActions();
        //Resetting the categories, will call the addCategoriesToDropDown method

        this.resetDropDownValue();
        this.shadeSelectedOption(StimApp.model.get('currentCategory'));
        this.resetActions();

        //adding border radius for top most and bottom most category option
        $('.categoryList div:nth-child(1) .actualOption .categoryOption', this.el).css('border-radius', '5px 5px 0px 0px');
        $('.categoryList div:nth-child(' + this.model.length + ') .actualOption .categoryOption', this.el).css('border-radius', '0px 0px 5px 5px');
    },

    resetActions: function() {
        $('#categoriesDropDown .transborder, .categoryOption', this.el).on('pointerup pointerdown pointermove', function(e) {
            StimApp.model.resetTimer();
        });
    },

    shadeSelectedOption: function(optionID) {
        //unshade all  options
        $('.categoryOption').each(function(index, value) {
            $(this).removeClass('optionPress');
            $(this).removeClass('selectedOption');

            //$('.actualOption #' + optionID).find('.optionLabel').css('color', 'rgba(65,64,66,1)');
        });

        //shade the selected option
        $('.actualOption #' + optionID).addClass('selectedOption');
        //$('.actualOption #' + optionID).find('.optionLabel').css('color', 'rgba(157,176,183,1)');
    },

    setActions: function() {
        var that = this;
        $('#categoriesDropDown, .categoryOption').off();

        //Open close the drop down
        // TODO: Add mouse support back somehow
        $('#categoriesDropDown', this.el).on('pointerup', function(e) {
            if (!this._mouseDownMenu)
                return;

            this._mouseDownMenu = false;
            $('.categoryList', that.el).toggleClass('active');
            if ($('.categoryList', that.el).hasClass('active')) {
                $('.transborder', that.el).addClass('buttonPress');
            } else {
                $('.transborder', that.el).removeClass('buttonPress');
            }

            that.toggleArrows();
        });

        //Mouse up remove highlight
        $('#categoriesDropDown', this.el).on('pointerup pointerleave', function(e) {
            if (e.type == 'pointerleave') {
                this._mouseDownMenu = false;

                if (!$('.categoryList', that.el).hasClass('active'))
                    $('.transborder', that.el).removeClass('buttonPress');
            }
            // $('.actualSelect .dropUpArrow polygon', that.el).attr('fill', 'white');
            //$('.actualSelect .dropDownArrow polygon', that.el).attr('fill', 'white');
        });

        //Mouse down highlight
        $('#categoriesDropDown', this.el).on('pointerdown', function(e) {
            this._mouseDownMenu = true;

            $('.transborder', that.el).addClass('buttonPress');
            //$('.actualSelect .dropUpArrow polygon', that.el).attr('fill', 'black');
            //$('.actualSelect .dropDownArrow polygon', that.el).attr('fill', 'black');
        });

        //Mousedown change background for options
        $('.categoryOption', this.el).on('pointerdown', function(e) {
            e.stopPropagation();
            that._mousedown = true;

            $(e.target).removeClass('selectedOption');

            $(e.target).addClass('optionPress');
            //$(e.target).find('.optionLabel').css('color', 'rgba(65,64,66,1)');
        });

        $('.categoryOption', this.el).on('pointerup pointerleave', function(e) {
            e.stopPropagation();
            e.preventDefault();

            if (e.type == 'pointerleave')
                that._mousedown = false;

            var id = $(e.target).attr('id');
            if (id == StimApp.model.get('currentCategory')) {
                $(e.target).addClass('selectedOption');
                return;
            }

            $(e.target).removeClass('optionPress');

            if (e.type == 'pointerup')
                $('.transborder', that.el).removeClass('buttonPress');

            //$(e.target).find('.optionLabel').css('color', 'rgba(159,178,185,1)');
        });
        //Select option
        var optionID = null;
        var optionValue = null;

        $('.categoryOption', this.el).on('pointerup', function(e) {
            e.stopPropagation();
            e.preventDefault();

            if (!that._mousedown)
                return;

            that._mousedown = false;

            optionID = $(e.target).attr('id');
            optionValue = $(e.target).text();

            //changing the value in AppModel to fire other events
            if (optionID === null || optionID === undefined)
                return;

            StimApp.model.set('currentCategory', optionID);
            ampm.logEvent('ui', 'selectCategory', optionID); //Analytics
            that.setDropDownValue(optionValue);
            that.shadeSelectedOption(optionID);

            //Close the dropdown
            $('.categoryList', that.el).toggleClass('active');
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
        $('.categoryList', that.el).removeClass('active');
        $('.transborder', that.el).removeClass('buttonPress');
        $('.dropDownArrow', that.el).hide();
        $('.dropUpArrow', that.el).show();
    },

    toggleArrows: function() {
        $('.dropDownArrow', this.el).toggle();
        $('.dropUpArrow', this.el).toggle();
    },

    resetCategories: function() {
        StimApp.model.set('currentCategory', 'all');
        this.selectDefaultCategory('all');
    },

});