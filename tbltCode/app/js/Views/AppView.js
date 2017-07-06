StimApp.Views.AppView = Backbone.View.extend({

    _panoView: null,
    _attractView: null,
    _controlsView: null,
    _languagesView: null,
    _helpOverlayView: null,
    _strigsView: null,

    _poiView: null,
    _poiEditor: null,
    _poiCollectionView: null,
    _zoomingIn: false,


    initialize: function() {
        var that = this;
        this.render();
        /*
        if (this.model.get('hasMultipleLanguages')) {
            this._languagesView = new StimApp.Views.LanguagesView({
                model: this.model.get('languagesModel'),
                el: $('#languagesView', this.$el),
            });
        } else {
            //Repositioning reset view and help view in absence of language view
            $('#helpView').css('margin-right', '20px');
            $('#resetView').css('margin-right', '285px');
        }
        */
        this._controlsView = new StimApp.Views.ControlsView({
            model: this.model.get('controlsModel'),
            el: $('#controlsView', this.$el),
        });

        this._helpOverlayView = new StimApp.Views.HelpOverlayView({
            model: this.model.get('helpOverlayModel'),
            el: $('#helpOverlayView', this.$el),
        });

        this._panoView = new StimApp.Views.PanoView({
            model: this.model.get('panoModel'),
            el: $('#panoView', this.$el),
        });

        this._attractView = new StimApp.Views.AttractView({
            model: this.model.get('attractModel'),
            el: $('#attractView', this.$el),
        });


        //Battery update

        window.navigator.getBattery().then(function(battery) {
            if (battery.level * 100 > 15)
                $('#battery').hide();
            else
                $('#battery').show();

            battery.addEventListener('levelchange', function() {
                if (battery.level * 100 > 15)
                    $('#battery').hide();
                else
                    $('#battery').show();
            });
        });

        this.monitorTouchEvents();

        this.listenTo(this.model, 'timeOut', this.stopLanguageListener);
        this.listenTo(this.model, 'panning', this.resetTimer);

        this.listenTo(this.model, 'onloadcomplete', this.poiInitialization);

        if (this.model.get('startingAttract')) {
            this.stopLanguageListener(); //at the very beginning the app begins in attract mode, therefore, the language listener should be stopped
        } else {
            this.startLanguageListener();
        }
        this.listenTo(this.model, 'backToNormal', this.startLanguageListener);
        this.listenTo(this.model, 'endAttract', this.startLanguageListener);

        //Limit number of touches to prevent krpano from zooming in on more than 2 touches
        StimApp.model.on('onloadcomplete', this.limitTouches);

        //poiView and poiEditorView are triggered form the onloadcomplete event from the krpano xml file

        //Switch between editor and normal view
        $(window).keydown(function(event) {
            if (!(event.which == 69 && event.ctrlKey))
                return;

            event.preventDefault();
            that.toggleEditor();
        });
    },

    //poiView and poiEditorView are triggered form the onloadcomplete event from the krpano xml file
    poiInitialization: function() {
        var that = this;


        if (this.model.get('isEditorOn')) {

            if (this._poiEditor !== null && this._poiEditor !== undefined) {
                this._poiEditor.remove();
                delete this._poiEditor;
                $("#appRoot", this.el).append(Mustache.render($('#poiContainerTemplate').html()));
            }
            this._poiEditor = new StimApp.Views.POIEditorView({
                model: this.model.get('poiEditorModel'),
                el: $('#poiContainer', that.el),
            });

        } else {
            if (this._poiCollectionView !== null && this._poiCollectionView !== undefined) {
                this._poiCollectionView.remove();
                delete this._poiCollectionView;
                $("#appRoot", this.el).append(Mustache.render($('#poiContainerTemplate').html()));
                this._poiCollectionView = new StimApp.Views.POICollectionView({
                    model: that.model.get('poiCollection'),
                    el: $('#poiContainer', that.el),
                });
            } else {
                //For the first time the app loads up
                this._poiCollectionView = new StimApp.Views.POICollectionView({
                    model: that.model.get('poiCollection'),
                    el: $('#poiContainer', that.el),
                });
                this._fullScreenView = new StimApp.Views.FullScreenView({
                    model: that.model.get('fullScreenModel'),
                    el: $('#fullScreenView', that.el),
                });
            }
        }
    },
    render: function() {
        this.$el.append(Mustache.render($('#rootTemplate').html(), this.model.toJSON()));
    },

    stopAttract: function(e) {
        console.log("Attract mode is not on " + e.keyCode);
    },

    notifyMiniView: function(poiModel) {
        this._controlsView.notifyMiniView(poiModel);
    },

    monitorTouchEvents: function() {
        var that = this;
        $('#panoView, #controlsView, #helpOverlayView').on('pointerup pointerdown pointermove', function() {
            that.resetTimer();
        });
        this.listenTo(StimApp.model, 'onloadcomplete', function() {
            StimApp.model.resetTimer();
        }); //reset timer even while panning
    },

    resetTimer: function() {
        if (StimApp.model.get('exitedAttract'))
            StimApp.model.set('hardResetView', false); //required to stop the inner box from panning until the view is hard reset to a given value
        StimApp.model.resetTimer();
    },

    stopLanguageListener: function() {
        if (!this.model.get('hasMultipleLanguages'))
            return;

        $('#languagesDropDown, .languageOption').off('pointerup pointerdown pointermove', this.resetTimer); // should be able to change language once the attract view begins. touching language drop down should not reset the timer
        // set z-index higher than the attract view for language change
        $('#languagesView').css('z-index', 2001);
    },

    startLanguageListener: function() {
        if (!this.model.get('hasMultipleLanguages'))
            return;

        $('#languagesDropDown, .languageOption').on('pointerup pointerdown pointermove', this.resetTimer); // touching language drop down should reset the timer
        // set z-index lower than the help view
        $('#languagesView').css('z-index', 901);
    },

    //Limit number of touches to prevent krpano from zooming in on more than 2 touches
    limitTouches: function() {
        document.getElementById('krpanoSWFObject').addEventListener('touchstart', function(e) {
            if (e.targetTouches.length > 2) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    },

    toggleEditor: function() {
        if (StimApp.model.get('isEditorOn')) {
            StimApp.model.set('isEditorOn', false);
            console.log('switching to editor mode');
            ampm.socket().emit('editorToggle');
        } else {
            console.log('switching to normal mode');
            StimApp.model.set('isEditorOn', true);
        }
    },

});