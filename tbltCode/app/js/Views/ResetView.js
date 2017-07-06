StimApp.Views.ResetView = Backbone.View.extend({

    _zoomingIn: false,
    _interval: null,
    _mousedown: false,

    defaults: {
        model: StimApp.Models.ResetModel,
    },


    initialize: function() {
        var that = this;
        this.render();
        this.listenTo(StimApp.model, 'change:currentStrings', this.render);

        this.listenTo(StimApp.model, 'resetComplete', this.stopInterval);
        this.listenTo(StimApp.model, 'change:currMode', this.resetToDefault);
        this.listenTo(StimApp.model, 'onloadcomplete', this.hardResetView);
        this.listenTo(StimApp.model, 'endAttract', this.smoothResetWithoutMiniViewTrigger);
        this.listenTo(StimApp.model, 'panning', this.checkAndResetButton);
        this.listenTo(StimApp.model, 'change:currentCategory', this.checkAndResetButton);


        var boundfunction = _.bind(this.resetPosition, this);
        this.$el.on('pointerup', boundfunction);

        //Mousedown highlight
        this.$el.on('pointerdown', function(e) {
            that._mousedown = true;
            $('#resetButton', this.el).addClass('buttonPress');
            //$('#resetButton', this.el).css('color', 'black');
            //$('#resetButton path', this.el).attr('stroke', 'black');
            //$('#resetButton polyline', this.el).attr('stroke', 'black');
        });

        this.$el.on('pointerup pointerleave', function(e) {
            if (e.type == 'pointerleave')
                that._mousedown = false;
            //Mouseup remove hightlight
            $('#resetButton', this.el).removeClass('buttonPress');
            //$('#resetButton', this.el).css('color', 'white');
            //$('#resetButton path', this.el).attr('stroke', 'white');
            //$('#resetButton polyline', this.el).attr('stroke', 'white');
        });

    },

    checkAndResetButton: function() {
        var krpano = document.getElementById('krpanoSWFObject');

        if ((krpano.get('view.hlookat') < StimApp.model.get('currvfov')) || (StimApp.model.get('currhlookat') != (krpano.get('view.hlookat') % 360)) && (StimApp.model.get('currhlookat') != (360 + (krpano.get('view.hlookat') % 360)))) {
            //set color
            if (krpano.get('view.vfov') >= StimApp.model.get('exactZoomOutValue')) {
                if (StimApp.model.get('currentCategory') == 'all')
                    $('#resetButton', this.el).addClass('inactive');
                else
                    $('#resetButton', this.el).removeClass('inactive');

                return;
            }

            $('#resetButton', this.el).removeClass('inactive');

        } else {
            //set grey
            if (StimApp.model.get('currentCategory') == 'all')
                $('#resetButton', this.el).addClass('inactive');
            else
                $('#resetButton', this.el).removeClass('inactive');
        }

    },

    resetPosition: function() {
        if (!this._mousedown)
            return;
        StimApp.model.trigger('resetHit');

        this._mousedown = false;
        StimApp.model.set('hardResetView', false); //to make the mini view move...
        ampm.logEvent('ui', 'reset'); //Analytics

        //logic to resetPosition
        var krpano = document.getElementById('krpanoSWFObject');

        //stopping any other zoom in action
        krpano.call("stoplookto()");
        krpano.call("lookto(" + StimApp.model.get('currhlookat') + "," + StimApp.model.get('currvlookat') + "," + StimApp.model.get('currvfov') + ", smooth(2, 2, 2), true, true, doneReset);");
        this._zoomingIn = true;

        //Code to show rectangle shrinking in size when zooming in
        /*
        clearInterval(this._interval);
        this._interval = setInterval(function() {
            StimApp.model.trigger('panning', krpano);
        }, 10);
        */

    },

    smoothResetWithoutMiniViewTrigger: function() {
        var krpano = document.getElementById('krpanoSWFObject');
        krpano.call("lookto(" + StimApp.model.get('currhlookat') + "," + StimApp.model.get('currvlookat') + "," + StimApp.model.get('currvfov') + ", smooth(2, 2, 2), true, true, doneReset);");
        this._zoomingIn = true;
        StimApp.model.set('currentCategory', 'all');
    },

    hardResetView: function() {
        if (!StimApp.model.get('startingAttract')) //if it is not attract mode this is not the code to be run. The Code to be run is in MiniView and PanoView. this is only for attract reset
            return;

        StimApp.model.set('hardResetView', true); //this value is reset in AppView once the user touches the screen. This is used in mini view to prevent the inner box to shift from center at start
        var krpano = document.getElementById('krpanoSWFObject');
        krpano.set('view.hlookat', StimApp.model.get('currhlookat'));
        krpano.set('view.vlookat', StimApp.model.get('currvlookat'));
        krpano.set('view.fov', StimApp.model.get('currvfov'));
    },

    stopInterval: function() {
        if (!this._zoomingIn)
            return;
        this._zoomingIn = false;
        clearInterval(this._interval);
        StimApp.model.set('exitedAttract', true);
        StimApp.model.set('hardResetView', false); //to make the mini view move...
    },

    //Show the help button
    render: function() {
        this.$el.children().remove(); //Remove all child elements and rerender
        this.$el.append(Mustache.render($('#resetTemplate').html(), StimApp.model.get('currentStrings')));
        this.resetActions();

        if (StimApp.model.get('currentLanguage') == 'fr') {
            this.$el.css('margin-right', '95px');
        }
    },

    resetActions: function() {
        $('#resetButton', this.el).on('pointerup pointerdown pointermove', function(e) {
            StimApp.model.resetTimer();
        });
    },

    resetToDefault: function() {
        this._zoomingIn = false;
        clearInterval(this._interval);
    },
});