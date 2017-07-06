StimApp.Models.AppModel = Backbone.Model.extend({
    events: {
        'positionMiniPOI': 'updateMiniPOIDummy',
        'deleteMiniPOI': 'deleteMiniPOIDummy',
        'panning': 'triggerDummy',
        'showMiniPOI': 'showMiniPOIDummy',
        'hideMiniPOI': 'hideMiniPOIDummy',
        'animationComplete': 'animationDummy',
        'animationComplete2': 'animationDummy2',
        'timeOut': 'timeOutDummy',
        'backToNormal': 'normalDummy',
        'endAttract': 'endAttractDummy',
        'showLoading': 'showLoadingDummy',
        'hideLoading': 'hideLoadingDummy',
        'onloadcomplete': 'onloadcompleteDummy',
        'onloaderror': 'onloaderrorDummy',
        'poiClicked': 'poiClickedDummy',
        'startAttract': 'startAttractDummy',
        'resetDefaults': 'resetDefaultsDummy',
        'resetDefaultLanguage': 'resetDefaultLanguageDummy',
        'resetHit': 'resetHitDummy',
        'resetComplete': 'resetCompleteDummy',
        'fullScreenClicked': 'fullScreenClickedDummy',
        'normalScreenClicked': 'normalScreenClickedDummy',
    },

    _controlsModel: null,
    _panoModel: null,
    _categories: StimApp.Models.CategoriesCollection, //List of Categories
    _timeOut: null,
    _timeOutSec: 300000,
    _timeOutError: 10000,
    _loadTimeOut: null,
    _reloadTimeOut: null,


    defaults: {
        startingAttract: true, //starts attract at the beginning
        isInAttract: false, //is put in Attract Mode at the start when this value is set to true
        hardResetView: true, // used to keep mini view box at the center while hard resetting the view angle during attract mode. Should be true because, it starts with Attract
        exitedAttract: false,

        isInHelp: false,
        controlsModel: null,
        languagesModel: null,
        allStrings: null,
        helpOverlayModel: null,
        panoModel: null,
        fullScreenModel: null,
        attractModel: null,
        poiCollection: null,
        poiEditorModel: null,

        currentLanguage: 'en', //id of the selected language. defaults to english at start
        currMode: 'day', //id of the selected mode. defaults to day mode at start
        currentCategory: 'all',
        currentStrings: null,
        isEditorOn: false,
        hasMultipleLanguages: true,
        hasMultipleModes: true,

        currhlookat: 0,
        currvlookat: 0, //this is the mid point between max and min vertical angles in the xml file
        currhfov: 0.7, //at max zoom out
        currvfov: 0.7, //at max zoom out
        exactZoomOutValue: 0.6666760685343467,

        significantMove: false, // used to differentiate between touch and swipe on POIView

        northlookat: 0,
        northvlookat: 0,

        modeChangehlookat: 0,
        modeChangevlookat: 0,
        modeChangefov: 0,

        // clickedPOI: false,
        multiTouch: false,

        zIndex: 5000,
        kioskNumber: null,

        selectedCubePOI: '1',
    },

    constructor: function(data, uistrings, isEditorOn, currhlookat, northLookAt, kioskNumber) {
        Backbone.Model.apply(this);
        var that = this;

        this.set('isEditorOn', isEditorOn);
        this.setEditor();

        this.set('currhlookat', currhlookat);
        this.set('northlookat', northLookAt);
        this.set('kioskNumber', kioskNumber);


        this.set('controlsModel', new StimApp.Models.ControlsModel(uistrings.uistrings.categories, uistrings.uistrings.modes, uistrings.uistrings.modesSubText, data.pointsOfInterest, this.get('currhlookat'), this.get('currvlookat')));

        /*
        if (uistrings.languages.length > 1) {
            this.set('hasMultipleLanguages', true);
            this.set('languagesModel', new StimApp.Models.LanguagesCollection(uistrings.languages));
        } else {
            this.set('hasMultipleLanguages', false);
        }

        if (Object.keys(uistrings.uistrings.modes).length > 1) {
            this.set('hasMultipleModes', true);
        } else {
            this.set('hasMultipleModes', false);
        }
*/
        this.set('allStrings', new StimApp.Models.StringsModel(uistrings.languages, uistrings.uistrings));
        this.set('helpOverlayModel', new StimApp.Models.HelpOverlayModel(uistrings.uistrings));
        this.set('attractModel', new StimApp.Models.AttractModel(data.attractLocations));
        this.set('panoModel', new StimApp.Models.PanoModel(this.get('currMode')));
        this.set('fullScreenModel', new StimApp.Models.FullScreenModel());



        if (this.get('isEditorOn')) {
            this.set('poiEditorModel', new StimApp.Models.POIEditorModel(data.pointsOfInterest, uistrings.uistrings.categories.en, uistrings.uistrings.modes.en));
        } else {
            this.set('poiCollection', new StimApp.Models.POICollection(data.pointsOfInterest));
        }


        this.listenTo(this, 'change:currentLanguage', this._updateStrings);
        this.listenTo(this, 'endAttract', this.endAttract);
        this.listenTo(this, 'change:isEditorOn', this.setViewParametersToURL);


        //reset counter for z-index on mode change because the z-indices of all POI are reset to default at this point
        this.reloadParametersFromURL();
        this._updateStrings(); //setting strings for first time

        this.listenTo(this, 'change:currMode', function() {
            that.setViewParametersToURL();
        });

        //Reload in case of load error
        this.listenTo(this, 'onloaderror', this.onloaderrorReload);

        this.listenTo(this, 'onloadcomplete', this.clearLoadTimeOut);

        //Reload in case of error in 10 seconds of onloadcomplete failure
        clearTimeout(this._loadTimeOut);
        this._loadTimeOut = setTimeout(function() {
            that.onloaderrorReload();
        }, this._timeOutError);
    },

    _updateStrings: function() {
        this.set('currentStrings', this.get('allStrings').currentStrings[this.get('currentLanguage')]); //setting strings for the current language
    },

    // is called by krpano when view changes
    onviewchange: function() {
        this.trigger('panning', document.getElementById('krpanoSWFObject'));
    },

    saveFile: function(key, blob, callback) {
        var errorHandler = function() {
            callback(false);
        };

        this.fs.root.getFile(key, {
            create: true
        }, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {

                fileWriter.onwriteend = function(e) {
                    callback(true);
                };

                fileWriter.onerror = function(e) {
                    console.error('Write failed: ' + e.toString());
                    callback(false);
                };

                fileWriter.write(blob);

            }, errorHandler);

        }, errorHandler);
    },

    readFile: function(key, callback) {
        var errorHandler = function() {
            callback(null);
        };

        var self = this;
        this.fs.root.getFile(key, {}, function(fileEntry) {
            // make sure the file actually exists
            fileEntry.file(function(file) {
                var reader = new FileReader();

                reader.onloadend = function(e) {
                    // if it loads return the direct url to the image
                    callback(self.fsUrl + key);
                };

                reader.onerror = function(e) {
                    callback(null);
                };

                reader.readAsDataURL(file);
            }, errorHandler);

        }, errorHandler);
    },

    setControlsData: function(keyValuePair) {
        this.get('controlsModel').setControls(keyValuePair.categories, keyValuePair.modes);
    },

    doneAnimation: function() {
        this.trigger('animationComplete', this);
    },

    doneAnimation2: function() {
        this.trigger('animationComplete2', this);
    },

    doneReset: function() {
        this.trigger('resetComplete', this);
    },
    resetTimer: function() {
        // console.log("reset timer");
        if (this.get('isInAttract')) {
            clearTimeout(this._timeOut);
            return;
        }

        var that = this;
        clearTimeout(this._timeOut);
        this._timeOut = setTimeout(function() {
            that.trigger('timeOut', that);
        }, this._timeOutSec);
    },

    clearTimer: function() {
        clearTimeout(this._timeOut);
    },

    endAttract: function() {
        this.resetTimer();
    },

    setViewParametersToURL: function() {
        var krpano = document.getElementById('krpanoSWFObject');
        var mode = this.get('currMode');
        var hlookat = krpano.get('view.hlookat');
        var vlookat = krpano.get('view.vlookat');
        var fov = krpano.get('view.fov');
        var category = this.get('currentCategory');
        var language = this.get('currentLanguage');
        var attract = this.get('startingAttract');
        var editorOn = this.get('isEditorOn');

        var newURL = "?mode=" + mode + "&hlookat=" + hlookat + "&vlookat=" + vlookat + "&fov=" + fov + "&category=" + category + "&language=" + language + "&attract=" + attract + "&editorOn=" + editorOn;

        var originalURL = window.location.href.toString().split("index.html")[0] + "index.html";
        window.location.href = newURL;
    },

    reloadParametersFromURL: function() {


        var url = window.location.href.toString();

        if (url.split("index.html")[1] === "") //if there are no parameters after index.html
            return;

        var parameters = url.split("index.html?")[1].split("&");
        var attract = parameters[6].split('=')[1];
        if (attract == "false") {
            this.set('startingAttract', false);
            this.set('exitedAttract', true);
        } else {
            this.set('startingAttract', true);
        }

        if (this.get('startingAttract') === true) {
            return;
        }


        this.set('currMode', parameters[0].split('=')[1]);

        this.set('modeChangehlookat', parameters[1].split('=')[1]);

        this.set('modeChangevlookat', parameters[2].split('=')[1]);

        this.set('modeChangefov', parameters[3].split('=')[1]);

        this.set('currentCategory', parameters[4].split('=')[1]);

        this.set('currentLanguage', parameters[5].split('=')[1]);
    },

    onloaderrorReload: function(e) {
        console.warn('krpano load fail', e);
        var originalURL = window.location.href.toString().split("index.html")[0] + "index.html";
        window.location.reload();
    },

    clearLoadTimeOut: function() {
        clearTimeout(this._loadTimeOut);
        console.log("URL post krpano load: " + window.location.href);
        /*
                var that = this;
                setTimeout(function() {
                    //look to a random krpano   spot
                    var krpano = document.getElementById('krpanoSWFObject');

                    var x = that.getRandomInt(-180, 180);
                    krpano.set('view.hlookat', 17);
                    console.log('hlookat : ', 17);

                    var y = that.getRandomInt(-10, 80);
                    krpano.set('view.vlookat', 47);
                    console.log('vlookat : ', 47);

                    var fov = that.getRandomInt(0, 90);
                    krpano.set('view.fov', 87);
                    console.log('fov : ', 87);

                    console.log('before switch mode : ' + that.get('currMode'));

                    clearTimeout(that._reloadTimeOut);
                    that._reloadTimeOut = setTimeout(
                        function() {
                            that.loopDayNight();
                        }, that._timeOutError
                    );
                }, 5000);
        */
    },

    getRandomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    },

    loopDayNight: function() {
        if (this.get('currMode') == 'day') {
            this.set('currMode', 'night');
        } else {
            this.set('currMode', 'day');
        }
    },

    setEditor: function() {

        var url = window.location.href.toString();

        if (url.split("index.html")[1] === "") //if there are no parameters after index.html
            return;

        var parameters = url.split("index.html?")[1].split("&");
        this.set('isEditorOn', JSON.parse(parameters[7].split('=')[1]));
    },


});