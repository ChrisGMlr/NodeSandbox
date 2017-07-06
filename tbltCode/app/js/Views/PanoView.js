StimApp.Views.PanoView = Backbone.View.extend({

    _touches: [],

    defaults: {
        model: StimApp.Models.PanoModel,
    },

    initialize: function() {
        var that = this;
        this.render();
        // Listen to a change of modes and load corresponding panorama files accordingly
        this.listenTo(StimApp.model, 'onloadcomplete', function() {
            that.analyticsListners();
            if (StimApp.model.get('startingAttract') === false) {
                that.loadFOVLookAt();
            }
        });

    },

    render: function() {
        StimApp.model.trigger('showLoading');

        this.$el.children().off();
        $('#krpanoSWFObject').off();
        $('#krpanoSWFObject').children().off();

        removepano("krpanoSWFObject");


        this.$el.children().remove();

        //this.$el.append(Mustache.render($('#panoTemplate').html()));
        if (StimApp.model.get('currMode') == 'day') {
            embedpano({
                swf: "content/panorama/day/OneLibertyGigapixelDay.swf",
                target: "panoView",
                passQueryParameters: true,
                html5: "always",
                id: "krpanoSWFObject"
            });

        } else if (StimApp.model.get('currMode') == 'night') {
            embedpano({
                swf: "content/panorama/night/OneLibertyGigapixelNight.swf",
                target: "panoView",
                passQueryParameters: true,
                html5: "always",
                id: "krpanoSWFObject"
            });
        }
    },

    loadFOVLookAt: function() {
        StimApp.model.set('hardResetView', true); //this value is reset in AppView once the user touches the screen. This is used in mini view to prevent the inner box to shift from center at start
        var krpano = document.getElementById('krpanoSWFObject');
        krpano.set('view.hlookat', StimApp.model.get('modeChangehlookat'));
        krpano.set('view.vlookat', StimApp.model.get('modeChangevlookat'));
        krpano.set('view.fov', StimApp.model.get('modeChangefov'));
    },

    analyticsListners: function() {
        var that = this;
        var krpano = document.getElementById('krpanoSWFObject');
        var startH = 0;
        var startV = 0;
        var startFOV = 0;
        var endH = 0;
        var endV = 0;
        var endFOV = 0;
        var threshold = 0.002;


        $('#krpanoSWFObject').on('touchstart', function(e) {
            startH = krpano.get('view.hlookat');
            startV = krpano.get('view.vlookat');
            startFOV = krpano.get('view.fov');
            for (var i = 0; i < e.originalEvent.changedTouches.length; i++) {
                that._touches.push(e.originalEvent.changedTouches[i].identifier);
            }
        });

        $('#krpanoSWFObject').on('touchend', function(e) {
            endH = krpano.get('view.hlookat');
            endV = krpano.get('view.vlookat');
            endFOV = krpano.get('view.fov');

            var index = that._touches.indexOf(e.originalEvent.changedTouches[0].identifier);
            if (index > -1) {
                that._touches.splice(index, 1);
            }


            if (endFOV !== startFOV) //zoom action took place.. so, return
            {
                if (that._touches.length !== 0)
                    return;

                if (endFOV > startFOV) //zoomout
                    ampm.logEvent('pano', 'zoom', 'out'); //Analytics
                else
                    ampm.logEvent('pano', 'zoom', 'in'); //Analytics
                return;
            }

            if (Math.abs(startH - endH) > threshold) {
                if ((endH - startH) > 0) {
                    ampm.logEvent('pano', 'pan', 'left'); //Analytics
                } else {
                    ampm.logEvent('pano', 'pan', 'right'); //Analytics
                }

            }

            if (Math.abs(startV - endV) > threshold) {
                if ((endV - startV) > 0) {
                    ampm.logEvent('pano', 'pan', 'up'); //Analytics
                } else {
                    ampm.logEvent('pano', 'pan', 'down'); //Analytics
                }
            }


            //used to close descbox on touch and not swipe
            var descBoxCloseThreshold = 0.002;
            if (Math.abs(startV - endV) > descBoxCloseThreshold || Math.abs(startH - endH) > descBoxCloseThreshold) {
                StimApp.model.set('significantMove', true); // used to differentiate between touch and swipe on POIView
            } else {
                StimApp.model.set('significantMove', false); // used to differentiate between touch and swipe on POIView
            }
        });



    },

});