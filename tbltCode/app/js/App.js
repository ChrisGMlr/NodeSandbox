var nodeData = [];
var StimApp = _.extend({

    Views: {},
    Models: {},


    model: null,
    view: null,

    initialized: false,

    Events: new Backbone.Model(),

    initialize: function() {
        //To start the app in full screen
        //chrome.app.window.current().fullscreen();

        if (this.initialized) {
            return;
        }

        window.name = "MPO"; //This name is used for day night change reload
        var that = this;
        $.getJSON("content/poiContent.json", function(poiContent) {
                console.log('pois.json loaded successfully');
                $.getJSON("content/pois.json", function(data) {
                        console.log('pois.json loaded successfully');
                        $.getJSON("content/strings.json", function(uistrings) {
                                console.log('strings.json loaded successfully');
                                ampm.socket().on('configRequest', function(configData) {
                                    console.log('Configuration loaded');
                                    that.model = new StimApp.Models.AppModel(data, uistrings, configData.editorModeOn, configData.horizontalLookAt, configData.northLookAt, configData.kioskNumber);
                                    that.view = new StimApp.Views.AppView({
                                        el: document.body,
                                        model: that.model
                                    });
                                    that.initialized = true;
                                    console.log('App Model and App View Initialized');
                                    console.log('Starting App heartbeat');
                                    this.heartInterval = setInterval(function() {
                                        ampm.heart();
                                    }, 1000 / 60);
                                });
                                ampm.socket().emit('configRequest');
                                console.log('Configuration requested');
                            })
                            .fail(function() {
                                console.error('strings.json load failed');
                            });
                    })
                    .fail(function() {
                        console.error('pois.json load failed');
                    });
            })
            .fail(function() {
                console.error('poiContent.json load failed');
            });
    }
});

$(window).ready(function() {
    // the debugger can't attach at this point in chrome apps for some reason, so when in dev add a timeout
    setTimeout(function() {
        StimApp.initialize();
    }, 1000);
});

function workAroundClipPathBug($el) {
    // there is a bug in chrome with clip paths when layers within an element are hardware accelerated.
    // found this workaround in a discussion here: https://code.google.com/p/chromium/issues/detail?id=237100
    // if the -webkit-mask-image is also applied and just set to a single black pixel, i.e. no masking in the image,
    // then the clip-path is applied correctly. 
    var blackPixelSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NkYGD4DwABCQEBtxmN7wAAAABJRU5ErkJggg==';
    $el.css({
        '-webkit-mask-image': 'url(' + blackPixelSrc + ')'
    });
}