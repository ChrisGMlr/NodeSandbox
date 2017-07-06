StimApp.Views.AttractView = Backbone.View.extend({
    _interval: null, // 10 seconds to fill the bar before going into attract mode
    _attractInterval: null, // used to loop between the two attract slides
    _attractPOIInterval: null,
    _attractLoopInterval: null, // Time after which the slides swap in attract mode
    _timerRunning: false, // If the slider is animating
    _locationNo: 0,
    _startLoop: false,
    _resetLanguageSequence: false,
    _loadingTimeOut: null,
    _sliderTime: 10000,

    initialize: function() {
        var that = this;
        this.render();
        this.$el.off();
        var boundfunction = _.bind(this.backToNormal, this);
        this.$el.on('pointerup', boundfunction);

        this.listenTo(StimApp.model, 'change:currentStrings', this.render);
        this.listenTo(StimApp.model, 'change:currentLanguage', this.monitorAttractLanguageChange);


        this.listenTo(StimApp.model, 'timeOut', this.startTimer);

        this.listenTo(StimApp.model, 'showLoading', this.showLoading);
        this.listenTo(StimApp.model, 'onloadcomplete', function() {
            that.hideLoadNStartAttract(StimApp.model.get('startingAttract')); //-------------------------------------------------------------------------------------------------------Edit this to start attract mode again
        }); //only for first time
        this.listenTo(StimApp.model, 'hideLoading', this.hideLoading);
    },

    render: function() {
        if ($('#timeOut', this.$el).hasClass('active')) {
            this.$el.children().remove();
            this.$el.append(Mustache.render($("#attractTemplate").html(), StimApp.model.get('currentStrings')));
            this.$el.addClass('active');
            $('#timeOut', this.$el).addClass('active');

        } else if ($('#attract1', this.$el).hasClass('active')) {
            this.$el.children().remove();
            this.$el.append(Mustache.render($("#attractTemplate").html(), StimApp.model.get('currentStrings')));
            this.$el.addClass('active');
            $('#attract2', this.$el).removeClass('active');
            $('#attract1', this.$el).addClass('active');

        } else if ($('#attract2', this.$el).hasClass('active')) {
            this.$el.children().remove();
            this.$el.append(Mustache.render($("#attractTemplate").html(), StimApp.model.get('currentStrings')));
            this.$el.addClass('active');
            $('#attract1', this.$el).removeClass('active');
            $('#attract2', this.$el).addClass('active');

        } else {
            this.$el.children().remove();
            this.$el.append(Mustache.render($("#attractTemplate").html(), StimApp.model.get('currentStrings')));
        }

        this.languageBasedSkinning();
    },


    languageBasedSkinning: function() {

        var currentLanguage = StimApp.model.get('currentLanguage');

        if (currentLanguage == "ge") {

            $('.attract1MainText').css('font-size', '65px');
            $('.attract1Footer, .attract2Footer').css('font-size', '16px');


            $('.attract2MainText').css('font-size', '50px');

            //for 96px font-size, the line height is 85px, so, change line height correspondingly
            $('.attract2MainText').css('line-height', (50 * 85 / 96) + 'px').css('padding-top', '80px');

        } else if (currentLanguage == "es") {

            $('.attract1MainText').css('font-size', '65px');
            $('.attract1Footer, .attract2Footer').css('font-size', '16px');


            $('.attract2MainText').css('font-size', '65px').css('padding-top', '54px');

            //for 96px font-size, the line height is 85px, so, change line height correspondingly
            $('.attract2MainText').css('line-height', (65 * 85 / 96) + 'px');

        } else if (currentLanguage == "fr") {

            $('.attract1Footer, .attract2Footer').css('font-size', '16px');


            $('.attract2MainText').css('font-size', '65px').css('padding-top', '92px');

            //for 96px font-size, the line height is 85px, so, change line height correspondingly
            $('.attract2MainText').css('line-height', (65 * 85 / 96) + 'px');
        }
    },
    animateSlider: function(time) {
        if (this._timerRunning)
            return;

        //clear any attract slides on screen
        clearInterval(this._attractInterval);
        $('#attract1', this.$el).removeClass('active');
        $('#attract2', this.$el).removeClass('active');

        var that = this;

        that._timerRunning = true;
        var i = 0;
        $(".timeSlider .slider").css('width', i + "%"); //start percentage

        var step = 10;
        clearInterval(that._interval);
        that._interval = setInterval(function() {
            i += step * 100 / time;
            $(".timeSlider .slider").css('width', i + "%");

            if (i >= 100) {
                that._timerRunning = false;
                clearInterval(that._interval);

                that.prepareForAttract();
            }
        }, step);
    },


    prepareForAttract: function() {
        this._timerRunning = false;
        clearInterval(this._interval);

        //fade out the timer
        $('#timeOut', this.$el).removeClass('active');

        //if night mode, the loading screen will show up, then to show attract after loading, set startingAttract on AppModel to true
        if (StimApp.model.get('currMode') == 'night') {
            StimApp.model.set('startingAttract', true); //setting this to true will show attract onloadcomplete. This is required when switching form night to day, since day is default
            StimApp.model.trigger('resetDefaults');
        } else {
            StimApp.model.trigger('resetDefaults');
            this.startAttractMode();
        }
    },

    startAttractMode: function() {
        if (StimApp.model.get('isInAttract'))
            return;
        StimApp.model.set('isInAttract', true);
        StimApp.model.trigger('startAttract');

        ampm.logEvent('ui', 'idle', 'start'); //Ananlytics

        StimApp.model.set('exitedAttract', false);

        //loop through the 3 locations
        var attractLocations = this.model.get('locations');
        var krpano = document.getElementById('krpanoSWFObject');
        krpano.call("lookto(" + attractLocations[this._locationNo].heading + "," + attractLocations[this._locationNo].pitch + "," + attractLocations[this._locationNo].fov + ", smooth(2, 2, 2), true, true, doneAnimation);");

        //No need to add the Code to show rectangle shrinking in size when zooming in, since the mini view rectangle is not seen in attract mode

        this._locationNo = (this._locationNo + 1) % attractLocations.length;

        this.listenTo(StimApp.model, 'animationComplete', this.swapAttractImages);
        StimApp.model.clearTimer();
    },

    swapAttractImages: function() {
        StimApp.model.off('animationComplete', this.swapAttractImages, this);
        StimApp.model.clearTimer(); //clearing the timer for the bar filling up

        //start attract image swap
        this.$el.addClass('active');
        var that = this;

        var showAttractImage = function() {
            $('#attract1', that.$el).addClass('active');
        };

        /*
        var swapImage = function() {
            if ($('#attract1', that.$el).hasClass('active')) {
                if (that._resetLanguageSequence) {
                    that._resetLanguageSequence = false;
                    that._startLoop = false;
                    StimApp.model.trigger('resetDefaultLanguage');
                }

                $('#attract1', that.$el).removeClass('active');
                $('#attract2', that.$el).addClass('active');
            } else {
                if (that._startLoop)
                    that._resetLanguageSequence = true;

                $('#attract1', that.$el).addClass('active');
                $('#attract2', that.$el).removeClass('active');
            }
        };
        */

        // swapImage();
        showAttractImage();
        // clearInterval(this._attractInterval);
        // this._attractInterval = setInterval(swapImage, 10000);
    },

    backToNormal: function(e) {
        if (e !== null && e !== undefined) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (StimApp.model.get('isInAttract')) {
            StimApp.model.set('isInAttract', false);
            //Do reset app stuff
            clearInterval(this._attractInterval);
            this.stopListening(StimApp.model, 'animationComplete', this.swapAttractImages);

            $('#attract1', this.$el).removeClass('active');
            $('#attract2', this.$el).removeClass('active');
            this.$el.removeClass('active');

            StimApp.model.trigger('endAttract');
            ampm.logEvent('ui', 'idle', 'end'); //Analytics
            return;
        }

        this._timerRunning = false;
        clearInterval(this._interval);
        $('#timeOut', this.$el).removeClass('active');
        this.$el.removeClass('active');
        StimApp.model.resetTimer();
        StimApp.model.trigger('backToNormal');
    },

    monitorAttractLanguageChange: function() {
        if (!StimApp.model.get('isInAttract') || StimApp.model.get('currentLanguage') == 'en')
            return;

        this._startLoop = true;
    },

    startTimer: function() {
        this.$el.addClass('active');
        $('#timeOut', this.$el).addClass('active');
        this.animateSlider(this._sliderTime); //take 10 seconds to fill the bar
    },

    stopLanguageListener: function() {
        $('#languagesDropDown, .languageOption').off('pointerup pointerdown pointermove', this.resetTimer); // should be able to change language once the attract view begins. touching language drop down should not reset the timer
        // set z-index higher than the attract view for language change
        $('#languagesView').css('z-index', 2001);
    },

    startLanguageListener: function() {
        $('#languagesDropDown, .languageOption').on('pointerup pointerdown pointermove', this.resetTimer); // touching language drop down should reset the timer
        // set z-index lower than the help view
        $('#languagesView').css('z-index', 901);
    },

    showLoading: function() {
        $('#loadingScreen').addClass('active');
    },

    hideLoading: function() {
        $('#loadingScreen').removeClass('active');
    },

    hideLoadNStartAttract: function(isAttract) {
        var that = this;
        clearTimeout(this._loadingTimeOut);
        this._loadingTimeOut = setTimeout(function() {
            StimApp.model.trigger('hideLoading');

            if (isAttract === true) {
                that.startAttractMode();
            }

            StimApp.model.set('startingAttract', false);
        }, 2000);
    },
});