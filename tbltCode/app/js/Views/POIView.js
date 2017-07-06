StimApp.Views.POIView = Backbone.View.extend({

    _container: null,
    _zoomingIn: false,
    _interval: null,
    _krpano: null,
    _transform: null,
    _rolledDown: true,
    _mysteryIconAnimated: false,
    _hv: null,
    _actionBlocked: false,
    _touchStarted: false,
    _swipingUp: false,
    _mouseDown: false,
    _clickedOnce: false, // keeps track of a click on a poiTitle, so that you can't spam clicks on a given poi
    _fadeInTransition: false,
    _currentCaseStudyIndex: -1,
    _caseStudyBoxRollingUp: false,
    _caseStudyBoxRolledUpCompletely: false,
    _crossButtonAnimating: false, //when transition from cross button to back button is happening 
    _backButtonAnimating: false, //when transition from     back button to cross button is happening
    _poiClickAnimating: false, //when the animation of the case study panel is happening
    _caseStudyClickAnimating: false, //when the animations for the case media description panels for a case study are happening
    _mediaDescPanelsOpen: true,
    _currDescIndex: -1,
    _currMediaIndex: -1,
    _videoPlayResetAttractInterval: null,
    _resetting: false,
    _currentlyPlayingVideo: null,
    _playButtonThreshold: 14,


    defaults: {
        model: StimApp.Models.POIModel,
    },
    initialize: function() {
        var that = this;
        this.initializePrivateVariables();

        this._krpano = document.getElementById('krpanoSWFObject');
        this.listenTo(StimApp.model, 'animationComplete', this.swipeUpAnimation);
        this.listenTo(StimApp.model, 'animationComplete2', this.stopInterval);

        this.listenTo(StimApp.model, 'resetHit', this.cancelZoomIn);
        this.listenTo(StimApp.model, 'resetComplete', this.resetDone);
        this.listenTo(StimApp.model, 'change:isInHelp', this.helpTriggerVideoPlayback);


        this.listenTo(StimApp.model, 'panning', this.revealPOI);
        this.listenTo(StimApp.model, 'panning', this.revealTitleDescription);

        this.listenTo(StimApp.model, 'endAttract', this.revealPOI);

        this.listenTo(StimApp.model, 'change:currentLanguage', this.changeLanguage);
        this.listenTo(StimApp.model, 'change:currMode', this.remove);
        this.listenTo(StimApp.model, 'change:currentCategory', this.categoryCloseTitleDescription);
        this.listenTo(StimApp.model, 'normalScreenClicked', this.returnToNormalScreen);


        this.listenTo(StimApp.model, 'poiClicked', function(callingPOI) {
            if (callingPOI == that)
                return;

            if (that._swipingUp || that._zoomingIn) {
                that.cancelZoomIn();
                return;
            }

            that.closeTitleDescription();
        });

        this.listenTo(StimApp.model, 'timeOut', this.hidePOI);
        this.listenTo(StimApp.model, 'startAttract', this.hidePOI);


        this.listenTo(StimApp.model, 'backToNormal', function() {
            that.revealPOI();
        });

        this.render();

        //Rolling up the box when the screen refreshes
        // this.closeTitleDescriptionAtStart();
        this.caseStudyBoxRollToggle();


        //Logic to get stop 2 touches at a time
        $('#poiIcon, .poiTitleBG, .poiTail, .poiTailSelected', this.el).on('touchstart', function(e) {
            if (e.originalEvent.touches.length > 1) {
                e.stopImmediatePropagation();
                e.preventDefault();
                StimApp.model.set('multiTouch', true);
            } else {
                StimApp.model.set('multiTouch', false);
            }
        });

        //stopPropagation on certain elements
        $('#poiIcon, .poiTitleBG, .poiTail, .poiTailSelected', this.el).on('mouseup touchend', function(e) {
            e.stopPropagation();

            if (that._poiClickAnimating)
                return;

            if (that._crossButtonAnimating)
                return;

            if (e.type == "mouseup") {
                that._mouseDown = false;
                that.poiClicked(that.model.get('id'));
                that.resetAllVideos();

                //Swap image to show pressed  Icon
                $('#poiIcon img', that.el).attr('src', that.model.get('pressedIcon'));

                //Pressed State for title
                //$('.poiTitleBG', that.el).removeClass('poiTitleBGPressed');
                return;
            }


            if (!that._touchStarted) {
                return;
            }

            // if (StimApp.model.get('multiTouch')) {

            //  if (StimApp.model.get('clickedPOI'))
            //      return;
            //  else
            //      StimApp.model.set('clickedPOI', true);
            // }
            var changedTouch = e.originalEvent.changedTouches[0];
            var elem = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
            if ($.contains(that.el, elem) || elem == that.el) {
                that.poiClicked(that.model.get('id'));
                that.resetAllVideos();
            } else {
                if (that._rolledDown || that._zoomingIn) {
                    //Pressed State for title
                    $('.poiTitleBG', that.el).addClass('poiTitleBGPressed');
                    that.showPressedCatIcon();
                    that.showSelectedTail();

                } else {
                    that.POIMouseUp(that.model.get('id'));
                }
                // that._poiClickAnimating = false;
            }
            that._mouseDown = false;
        });



        $('#poiIcon, .poiTitleBG, .poiTail, .poiTailSelected', this.el).on('mousedown touchstart', function(e) {
            e.stopPropagation();
            if (that._poiClickAnimating)
                return;
            that._mouseDown = true;
            that.POIMouseDown(that.model.get('id'));
        });


        //Handle mouse click outside of the POI Title
        $('#poiIcon, .poiTitleBG, .poiTail, .poiTailSelected', this.el).on("mouseleave", function(evt) {
            if (!that._mouseDown)
                return;
            if (that._poiClickAnimating)
                return;
            if (that._rolledDown || that._zoomingIn) {
                //Swap image to show pressed  Icon
                $('#poiIcon img', that.el).attr('src', that.model.get('pressedIcon'));

                //Pressed State for title
                $('.poiTitleBG', that.el).addClass('poiTitleBGPressed');
                that.showPressedCatIcon();
                that.showSelectedTail();
                //this.growPOIcon();

            } else {
                that.POIMouseUp(that.model.get('id'));

            }
        });


        $('#nextButton', this.el).on('pointerup', function(e) {
            e.stopPropagation();
            return;
        });
        $('#prevButton', this.el).on('pointerup', function(e) {
            e.stopPropagation();
            return;
        });

        //Preventing the movement of DescBox on Touch and Drag
        $('#caseStudyBox', this.el).on('touchend mousedown mouseup touchstart', function(e) {
            e.stopPropagation();
            return;
        });

        this.monitorTouchEvents();
    },

    showSelectedTail: function() {
        $('.poiTail', this.el).hide();
        $('.poiTailSelected', this.el).css('display', 'inline-block');
    },

    hideSelectedTail: function() {
        $('.poiTail', this.el).css('display', 'inline-block');
        $('.poiTailSelected', this.el).hide();
    },

    helpTriggerVideoPlayback: function(e) {
        var that = this;
        if (StimApp.model.get('isInHelp')) {
            if (that._currentlyPlayingVideo === null)
                return;
            if (that._currentlyPlayingVideo.paused)
                return;
            that._currentlyPlayingVideo.pause();
            clearInterval(that._videoPlayResetAttractInterval);

            // Update the button to 'Play'
            that._currentlyPlayingVideo.parentNode.getElementsByClassName('playButton')[0].setAttribute("style", "display:block");
        } else {
            if (that._currentlyPlayingVideo === null)
                return;
            if (that._currentlyPlayingVideo.paused)
                return;
            that._currentlyPlayingVideo.play();
            clearInterval(that._videoPlayResetAttractInterval);
            that._videoPlayResetAttractInterval = setInterval(function() {
                StimApp.model.resetTimer();
            }, 100);
            // Update the button to 'Pause'
            that._currentlyPlayingVideo.parentNode.getElementsByClassName('playButton')[0].setAttribute("style", "display:none");
        }
    },

    clearPrivateVariables: function() {
        delete this._container;
        delete this._zoomingIn;
        delete this._interval;
        delete this._krpano;
        delete this._transform;
        delete this._rolledDown;
        delete this._mysteryIconAnimated;
        delete this._hv;
        delete this._actionBlocked;
        delete this._touchStarted;
        delete this._swipingUp;

        this.initializePrivateVariables();
    },

    initializePrivateVariables: function() {
        this._container = null;
        this._zoomingIn = false;
        this._interval = null;
        this._krpano = null;
        this._transform = null;
        this._rolledDown = true;
        this._mediaDescPanelsOpen = true;
        this._mysteryIconAnimated = false;
        this._hv = null;
        this._actionBlocked = false;
        this._touchStarted = false;
        this._swipingUp = false;
    },

    render: function() {
        $(this.el).append(Mustache.render($('#poiViewTemplate').html(), this.model.attributes));

        //Render mini poi
        StimApp.model.trigger('positionMiniPOI', this.model);

        //Smooth display transition for showing/hiding pois on FOV change
        this.el.style.transition = "opacity 0.3s ease-out";


        //limiting the click event to only the POI Icon

        //Setting title and description bar position for surprise / mystery spot
        // if (this.model.get('isSurpriseSpot')) {
        //     //$('#poiIcon', this.el).addClass('mysteryIcon');  //mystery spot animation
        //     $('#poiIcon', this.el).css('width', '83px');
        //     $('#poiIcon', this.el).css('height', '83px');
        //     $('#poiIcon', this.el).css('top', '-16px');
        //     $('#poiIcon', this.el).css('left', '-15px');
        //     $('#poiTitle', this.el).css('bottom', '56px');
        //     $('#caseStudyBox', this.el).css('top', '59px');

        //     var height = $("#poiTitle", this.el).height() + 10; //adding 2
        //     var width = $("#poiTitle", this.el).width() + 22; //Adding 20 to take care of border and box shadow
        //     $('#poiTitle', this.el).css('clip', 'rect(' + height + 'px,' + width + 'px,' + height + 'px,' + '0px)'); //clip is completely
        // }

        var that = this;
        //Setting fields
        var id = this.model.get('id');
        var title = this.model.get('title');
        var categories = this.model.get('categories');
        var modes = this.model.get('modes');
        // var isSurpriseSpot = this.model.get('isSurpriseSpot');
        var descriptionZoom = this.model.get('descriptionZoom');
        var revealZoom = this.model.get('revealZoom');



        if (!id || !title || !categories || !modes || !descriptionZoom || !revealZoom)
            return;
        var i = 0;
        _.each(this.model.get('caseStudies'), function(caseStudy) {
            i++; // increment to the next case study div
            var slickElement = $('.mediaBox > .mediaBorder div:nth-of-type(' + i + ') #imageBox', that.el);
            if (caseStudy.media.length !== 0) {
                $(slickElement).slick({
                    dots: true,
                    infinite: true,
                    speed: 200,
                    fade: false,
                    cssEase: 'linear',
                    adaptiveHeight: true,
                    touchMove: true,
                    swipe: true,
                    touchThreshold: 5,
                    slidesToShow: 1,
                    slidesToScroll: 1
                        //prevArrow: $('#prevButton', that.el),
                        //nextArrow: $('#nextButton', that.el),
                });

                // $('#attributions', this.el).slick({
                //     dots: false,
                //     infinite: true,
                //     speed: 0,
                //     fade: true,
                //     cssEase: 'linear',
                //     adaptiveHeight: true,
                //     touchMove: false,
                //     swipe: false,
                //     prevArrow: $('.slick-prev', that.el),
                //     nextArrow: $('.slick-next', that.el),
                // });
            } else {
                $(slickElement, that.el).off();
                $(slickElement, that.el).children().off();
                $(slickElement, that.el).remove();

                // $('#attributions', this.el).off();
                // $('#attributions', this.el).children().off();
                // $('#attributions', this.el).remove();

                // $('#descriptionText', this.el).css('margin-bottom', '10px');

            }

            that.setStatesForSlick(slickElement);
            that.setPlayPauseFunctionality(slickElement[0]);
            that.setFullScreenFunctionality(slickElement[0]);
        });
        //this.changeLanguage();
        // $('.slick-list', this.el).css('height', 'auto');
        if (StimApp.model.get('isInAttract')) {
            this.hidePOI();
            return;
        }

        if (StimApp.model.get('currentCategory') == 'all' || _.contains(this.model.get('categories'), StimApp.model.get('currentCategory'))) {
            this.showPOI();
            this.showMiniPOI();
        } else {
            this.hidePOI();
            this.hideMiniPOI();
        }

        //Conditional padding top based on single or double lines of text
        /*
        if ($('.poiTitleBG div', this.el).height() > 40) {
            //padding 2px
            $('.poiTitleBG div', this.el).css('padding-top', '10px');
            $('.poiTitleBG div', this.el).css('padding-bottom', '10px');
        } else {
            //padding 20px
            $('.poiTitleBG div', this.el).css('padding', '20px');
            // $('.poiTitleBG div', this.el).css('padding-bottom', '10px');

        }
        */


        this.roundCaseStudyListEdges();

        this.setPOIDetailActions();
    },

    remove: function() {
        this.stopInterval();
        StimApp.model.trigger('deleteMiniPOI', this.model);

        this.clearPrivateVariables();
        this.stopListening();
        // COMPLETELY UNBIND THE VIEW
        this.undelegateEvents();

        this.$el.removeData().unbind();

        // Remove view from DOM
        Backbone.View.prototype.remove.call(this);
        Backbone.View.prototype.remove.apply(this, arguments);
    },

    showPOI: function() {
        this.el.style.opacity = 1;
        $('#poiIcon', this.el).removeClass('inactive');
        $('#poiTitle', this.el).removeClass('inactive');
        $('.poiTitleBG', this.el).removeClass('inactive');
        $('.poiTail', this.el).removeClass('inactive');

        $('#caseStudyBox', this.el).addClass('transitionDescBox');
        $('#caseStudyBox', this.el).removeClass('inactiveDescBox');
    },

    hidePOI: function() {
        $('#poiIcon', this.el).addClass('inactive');
        $('#poiTitle', this.el).addClass('inactive');
        $('.poiTitleBG', this.el).addClass('inactive');
        $('.poiTail', this.el).addClass('inactive');


        $('#caseStudyBox', this.el).addClass('transitionDescBox');
        $('#caseStudyBox', this.el).addClass('inactiveDescBox');

        this.el.style.opacity = 0;
    },

    showMiniPOI: function() {
        StimApp.model.trigger('showMiniPOI', this.model);
    },

    hideMiniPOI: function() {
        StimApp.model.trigger('hideMiniPOI', this.model);
    },

    poiClicked: function(name) {
        if (this.model.get('id').toString() !== name)
            return;

        if (this._clickedOnce)
            return;
        else
            this._clickedOnce = true;

        //Fix to solve the first image load to proper height issue is in slick.js under the comment // get first image
        // $('#attributions .slick-list', this.el).css('height', 'auto');

        //Animate Surprise / Mystery Spots only //mystery spot animation
        // if (this.model.get('isSurpriseSpot')) {
        //  this.animateSurpriseSpot();
        // }

        //required for next and previous buttons on poi
        StimApp.model.set('selectedCubePOI', this.cid);

        //close all other POI titles and descriptions
        StimApp.model.trigger('poiClicked', this);
        var that = this;

        StimApp.model.set('hardResetView', false); //to make the mini view move...

        //show the text in red
        if (this._rolledDown) {
            $('.poiTitleBG', this.el).removeClass('poiTitleBGPressed');
            this.hidePressedCatIcon();
            this.hideSelectedTail();
            this.shrinkPOIcon();
        } else {
            $('.poiTitleBG', this.el).addClass('poiTitleBGPressed');
            this.showPressedCatIcon();
            this.showSelectedTail();
            this.growPOIcon();
        }

        var krpano = document.getElementById('krpanoSWFObject');

        //if the descBox is not rolled down and the poi is not at 1/4th distance from the top of screen 
        var hasMoved = false;
        if (!this._hv) {
            hasMoved = true;
        } else {
            var hv = this._krpano.screentosphere((screen.width / 2), (screen.height / 2));
            hasMoved = ((this._krpano.get('view.fov') != this.model.get('descriptionZoom')) || (this._hv.y).toFixed(2) != (hv.y).toFixed(2)); //if posisition of fov of the center point changes
        }

        if (!this._rolledDown && hasMoved) {
            // var hvAtCurrentFOV = krpano.screentosphere(screen.width / 2, screen.height / 2.5);
            // var newPitch = this.model.get('descriptionZoom') * hvAtCurrentFOV.y / krpano.get('view.fov');
            krpano.call("lookto(" + (this.model.heading) + "," + (this.model.pitch) + "," + this.model.get('descriptionZoom') + ", smooth(2, 2, 2), true, true, doneAnimation);");
            this._zoomingIn = true;

            //Code to show rectangle shrinking in size when zooming in
            clearInterval(this._interval);
            this._interval = setInterval(function() {
                //console.log(that.model.get('title'));
                StimApp.model.trigger('panning', krpano);
            }, 10);
        } else {

            this.caseStudyBoxRollToggle();
            this.shrinkBackCloseIcon();

            //setTimeout of 300ms for the animations to happen sequentially
            setTimeout(function() {
                that.moveCrossButtonToFocus();
                that.unswapAllCaseStudyOptions();
            }, 300);
            that._currentCaseStudyIndex = -1;
            // if (this.model.get('isSurpriseSpot'))
            //     that.titleBoxSlideUp();
        }
        this._touchStarted = false;
    },

    resetDone: function() {
        this._resetting = false;
    },

    cancelZoomIn: function() {
        this._resetting = true;
        if (!this._zoomingIn)
            return;

        $('.poiTitleBG', this.el).removeClass('poiTitleBGPressed');
        this.hidePressedCatIcon();
        this.hideSelectedTail();
        this.shrinkPOIcon();
        this.closeTitleDescription();

        this._zoomingIn = false;
        this._clickedOnce = false;


        clearInterval(this._interval);
    },

    swipeUpAnimation: function() {
        if (!this._zoomingIn)
            return;
        this._zoomingIn = false;

        //Once the animation is done, reposition the pano to get the hotspot at 1/4th the center of the screen, only when descBox is not rolledDonw
        /*
        if (!this._rolledDown) {
            this._hv = this._krpano.screentosphere((screen.width / 2), 3 * screen.height / 4);
            this._krpano.call("lookto(" + this._hv.x + "," + this._hv.y + "," + this.model.get('descriptionZoom') + ", smooth(10, 10, 10), true, true, doneAnimation2);");
            this._swipingUp = true;
        }
        */
        this.stopInterval();

        //Once the zoomin is complete animate the description box
        this.caseStudyBoxRollToggle();
        this.growBackCloseIcon();
        //Logic for pois with a single casestudy
        if (this.model.get('caseStudies').length == 1) {
            var id = 0;
            this._currentCaseStudyIndex = id;
            this._caseStudyBoxRolledUpCompletely = true;
            $('.caseStudyList > div:nth-child(' + (this._currentCaseStudyIndex + 1) + ') .actualOption .caseStudyOption', this.el).addClass('optionPress');
            this.selectDescriptionSwitch(id);
            this.selectMediaSwitch(id);
        }

    },

    setStatesForSlick: function(slickElement) {
        var that = this;
        $('.slick-next', slickElement).attr('touch-action', 'none'); //needed for pointer events
        $('.slick-prev', slickElement).attr('touch-action', 'none'); //needed for pointer events

        $('.slick-next', slickElement).on('mousedown touchstart', function() {
            $('.slick-next', slickElement).addClass('nextPressed');
        });

        $('.slick-next', slickElement).on('mouseup touchend', function() {
            $('.slick-next', slickElement).removeClass('nextPressed');
        });

        $('.slick-next', slickElement).on('pointerleave', function() {
            $('.slick-next', slickElement).removeClass('nextPressed');
        });

        $('.slick-prev', slickElement).on('mousedown touchstart', function() {
            $('.slick-prev', slickElement).addClass('prevPressed');
        });

        $('.slick-prev', slickElement).on('mouseup touchend', function() {
            $('.slick-prev', slickElement).removeClass('prevPressed');
        });

        $('.slick-prev', slickElement).on('pointerleave', function() {
            $('.slick-prev', slickElement).removeClass('prevPressed');
        });

        $(slickElement).on('beforeChange', function(event, slick, currentSlide, nextSlide) {
            if (currentSlide === nextSlide)
                return;

            that.resetAllVideos();
            if (that._currentCaseStudyIndex >= 0)
                ampm.logEvent('poi', 'image', that.model.get('caseStudies')[that._currentCaseStudyIndex].caseStudyName.en); //Analytics
        });
    },

    stopInterval: function() {
        //Code to show rectangle shrinking in size when zooming in
        this._swipingUp = false;
        this._clickedOnce = false;

        clearInterval(this._interval);
    },

    caseStudyBoxRollToggle: function() {
        var that = this;
        that._poiClickAnimating = true;

        // that._caseStudyBoxRollingUp = true;
        //set a higher z-index to the element so that the POIs are not infront of the description box
        if (!that._rolledDown) {
            StimApp.model.set('zIndex', StimApp.model.get('zIndex') + 1);
            that.el.style['z-index'] = StimApp.model.get('zIndex');
            ampm.logEvent('poi', 'open', that.model.get('titles').en); //Analytics
        }

        if (that._mediaDescPanelsOpen) {
            that.rollUpMediaDescriptionPanels();
        }

        if (that._rolledDown && !StimApp.model.get('significantMove')) {
            that.shrinkBackCloseIcon();
        }

        $(".caseStudyList", this.el).slideToggle("slow", function() {

            that._clickedOnce = false;
            that._poiClickAnimating = false;

            if (that._rolledDown === false) {
                that.resetPOITitleStyle(); // reset the title box to unclicked state

                //close POI Desc Box on tap on the pano, and not on swipe
                $('#krpanoSWFObject').off('touchend', that.onDescBoxOpen);

                //unselect all case study options after closing
                _.each($('.caseStudyList', that.el).children('.csOptionContainer'),
                    function(child) {
                        $('.actualOption .caseStudyOption', $(child)).removeClass('optionPress');
                    });

                //close any open back close icons: check to see if it is not already animating towards closing

                if (!that._crossButtonAnimating) {
                    $('#backCrossIcon', that.el).css('transition', 'all 0.3s linear');

                    that._crossButtonAnimating = true;

                    $('#backCrossIcon', that.el).css('transform', 'scale(0,0)');
                    $('#backCrossIcon', that.el).css('top', '-16px');
                    setTimeout(function() {
                        that._crossButtonAnimating = false;
                    }, 300);
                }
                /*
                                var that = this;
                                setTimeout(function() {
                                    that.shrinkPOIcon();
                                    $('#poiIcon', that.el).css('transform', 'scale(1,1)');

                                    setTimeout(function() {
                                        that._crossButtonAnimating = false;
                                    }, 300);
                                }, 300);*/

            } else {
                StimApp.model.set('significantMove', false);
                $('#krpanoSWFObject').on('touchend', {
                    obj: that
                }, that.onDescBoxOpen);

                //$('#krpanoSWFObject').on('touchend', that.onDescBoxOpen);
            }
        });


        //This if block has to be after slideToggle to avoid height issues with slick
        // if (!that._rolledDown) {
        //     $('#imageBox', that.el).slick('slickGoTo', 0, true);
        // }


        // if (this._rolledDown)
        //  StimApp.model.set('clickedPOI', false);
        this._rolledDown = !this._rolledDown;
    },

    onDescBoxOpen: function(event) {
        var that = event.data.obj;
        if (that._caseStudyClickAnimating)
            return;

        if (!StimApp.model.get('significantMove')) {
            that.closeTitleDescription();
        }
    },

    titleBoxSlideUp: function() {
        var that = this;
        var height = $("#poiTitle", this.el).height() + 10;
        var width = $("#poiTitle", this.el).width() + 22;

        if (!this._rolledDown) {
            //Logic to slide down to close
            this.titleBoxSlideDown(width, height);
        } else {

            //Logic for roll up to reveal
            $("#poiTitle", this.el).animate({
                opacity: 1
            }, {
                progress: function(a, p, c) {
                    $("#poiTitle", that.el).css('clip', 'rect(' + (height - (p * height)) + 'px,' + width + 'px,' + height + 'px,' + '0px)');
                }
            });
        }
    },

    titleBoxSlideDown: function(width, height) {
        var that = this;
        var finalHeight = height;
        var step = 0;
        var finalWidth = width;
        $("#poiTitle", this.el).animate({
            opacity: 1
        }, {
            progress: function(a, p, c) {
                step = (p * finalHeight);
                $("#poiTitle", that.el).css('clip', 'rect(' + (step) + 'px,' + finalWidth + 'px,' + finalHeight + 'px,' + '0px)');
            }
        });
    },

    animateSurpriseSpot: function() {
        //$('#poiIcon', this.el).toggleClass('close');
        // this._mysteryIconAnimated = !this._mysteryIconAnimated;

        // if(this._mysteryIconAnimated)
        // {
        // //load the normal icon in place of the Mystery icon
        // var normalFileName = this.model.get('Philadelphia Museum of Art No. 1/poster.png').replace('MPOI','POI'); //getting filename for non-mystery spot version of the icon

        // //load the normal icon in place of the Mystery icon
        // var pressedFileName = this.model.get('pressedIcon').replace('MPOI','POI');//getting filename for non-mystery spot version of the icon

        // //wait for the animation to be over and then animate the normal icon growing
        // setTimeout(function() {}, 400);
        // }
    },

    revealPOI: function() {
        var krpano = document.getElementById('krpanoSWFObject');
        if (StimApp.model.get('isInAttract') || StimApp.model.get('startingAttract'))
            return;
        if (krpano.get('view.fov') <= this.model.get('revealZoom')) {
            if (StimApp.model.get('currentCategory') == 'all' || _.contains(this.model.get('categories'), StimApp.model.get('currentCategory'))) {
                this.model.set('isHidden', false);
                this.showPOI();
            }

        } else {
            var floatingRoomForReset = 0.1;
            if (krpano.get('view.fov') <= StimApp.model.get('currvfov') + floatingRoomForReset)
                return;
            if (StimApp.model.get('currentCategory') == 'all' || _.contains(this.model.get('categories'), StimApp.model.get('currentCategory'))) {
                this.model.set('isHidden', true);
                this.hidePOI();
                this.closeTitleDescription();
            }
        }
    },


    revealTitleDescription: function(krpano) {
        var threshold = 0.02;
        if (this._rolledDown && krpano.get('view.fov') > (this.model.get('descriptionZoom') + threshold)) {
            this.closeTitleDescription();
        }
    },

    closeTitleDescription: function() {
        var that = this;
        if (this._caseStudyClickAnimating)
            return;

        if (this._rolledDown) {
            //  StimApp.model.set('clickedPOI', false);
            this.caseStudyBoxRollToggle();
            that.rollUpMediaDescriptionPanels();
            this.shrinkBackCloseIcon();

            //setTimeout of 300ms for the animations to happen sequentially
            setTimeout(function() {
                that.moveCrossButtonToFocus();
                that.unswapAllCaseStudyOptions();
            }, 300);
            that._currentCaseStudyIndex = -1;

            // if (this.model.get('isSurpriseSpot')) {
            //     this.titleBoxSlideUp();
            // }
        } else {
            //just a quick check to make sure the cross button doesn't stay on screen once the case study roll box is closed
            if (!that._crossButtonAnimating) {
                $('#backCrossIcon', that.el).css('transition', 'all 0.3s linear');

                that._crossButtonAnimating = true;

                $('#backCrossIcon', that.el).css('transform', 'scale(0,0)');
                $('#backCrossIcon', that.el).css('top', '-16px');
                setTimeout(function() {
                    that._crossButtonAnimating = false;
                }, 300);
            }
        }
    },

    categoryCloseTitleDescription: function() {
        var that = this;
        if (StimApp.model.get('currentCategory') == 'all' || _.contains(this.model.get('categories'), StimApp.model.get('currentCategory'))) {
            return;
        }
        //wait for half a second and then close it
        setTimeout(function() {
            that.closeTitleDescription();
        }, 500);
    },

    // closeTitleDescriptionAtStart: function() {
    //     //  StimApp.model.set('clickedPOI', false);
    //     $("#caseStudyBox", this.el).slideToggle("fast", function() {});
    //     if (this.model.get('isSurpriseSpot')) {
    //         this.titleBoxSlideUp();
    //     }
    //     this._rolledDown = false;
    // },

    POIMouseDown: function(name) {
        if (this.model.get('id').toString() !== name)
            return;
        if (this._clickedOnce)
            return;
        if (this._rolledDown) {
            //Pressed State for title
            $('.poiTitleBG', this.el).removeClass('poiTitleBGPressed');
            this.hidePressedCatIcon();
            this.hideSelectedTail();
            this.shrinkPOIcon();
        } else {
            //Swap image to show pressed  Icon
            $('#poiIcon img', this.el).attr('src', this.model.get('pressedIcon'));
            //Pressed State for title
            $('.poiTitleBG', this.el).addClass('poiTitleBGPressed');
            this.showPressedCatIcon();
            this.showSelectedTail();
            this.growPOIcon();
        }

        this._touchStarted = true;

    },

    hidePressedCatIcon: function() {
        $('.catIcon', this.el).show();
        $('.catIconPressed', this.el).hide();
    },

    showPressedCatIcon: function() {
        $('.catIcon', this.el).hide();
        $('.catIconPressed', this.el).show();
    },

    growPOIcon: function() {
        $('#poiIcon', this.el).css('transition', 'none');
        $('#poiIcon', this.el).css('width', '60px');
        $('#poiIcon', this.el).css('height', '60px');
        $('#poiIcon', this.el).css('left', '-3px');
        $('#poiIcon', this.el).css('top', '-3px');
    },

    shrinkPOIcon: function() {
        $('#poiIcon', this.el).css('width', '53px');
        $('#poiIcon', this.el).css('height', '53px');
        $('#poiIcon', this.el).css('left', '0px');
        $('#poiIcon', this.el).css('top', '0px');
    },

    growBackCloseIcon: function() {
        $('#poiIcon', this.el).css('transition', 'all 0.3s linear');
        $('#poiIcon', this.el).css('transform', 'scale(0,0)');

        var that = this;
        setTimeout(function() {
            $('#backCrossIcon', that.el).css('transform', 'scale(1,1)');
            $('#backCrossIcon', that.el).css('top', '3px');

        }, 300);
    },

    shrinkBackCloseIcon: function() {
        $('#backCrossIcon', this.el).css('transition', 'all 0.3s linear');

        this._crossButtonAnimating = true;

        $('#backCrossIcon', this.el).css('transform', 'scale(0,0)');
        $('#backCrossIcon', this.el).css('top', '-16px');

        var that = this;
        setTimeout(function() {
            that.shrinkPOIcon();
            $('#poiIcon', that.el).css('transform', 'scale(1,1)');

            setTimeout(function() {
                that._crossButtonAnimating = false;
            }, 300);
        }, 300);
    },

    POIMouseUp: function(name) {
        if (this.model.get('id').toString() !== name)
            return;
        if (this._clickedOnce)
            return;
        if (this._rolledDown) {
            //Swap image to show pressed  Icon
            $('#poiIcon img', this.el).attr('src', this.model.get('pressedIcon'));
            //Pressed State for title
            $('.poiTitleBG', this.el).addClass('poiTitleBGPressed');
            this.showPressedCatIcon();
            this.showSelectedTail();
            this.growPOIcon();
        } else {
            //Swap image to show pressed  Icon
            $('#poiIcon img', this.el).attr('src', this.model.get('pressedIcon'));

            //Pressed State for title
            $('.poiTitleBG', this.el).removeClass('poiTitleBGPressed');
            this.hidePressedCatIcon();
            this.hideSelectedTail();
            this.shrinkPOIcon();
        }
        this._touchStarted = false;
    },

    resetPOITitleStyle: function() {
        $('.poiTitleBG', this.el).removeClass('poiTitleBGPressed');
        this.hidePressedCatIcon();
        this.hideSelectedTail();
        this.shrinkPOIcon();
        this._clickedOnce = false;
    },

    rollDownMediaPanel: function(id) {
        var that = this;

        if (that._mediaDescPanelsOpen) {
            return;
        }

        $('.mediaBox', that.el).slideDown(function() {
            that._mediaDescPanelsOpen = true;
        });
    },

    rollDownDescriptionPanel: function() {
        var that = this;
        that._caseStudyClickAnimating = true;
        if (that._mediaDescPanelsOpen) {
            that._caseStudyClickAnimating = false;
            return;
        }

        $('.descBox', that.el).slideDown(function() {
            that._mediaDescPanelsOpen = true;
            that._caseStudyClickAnimating = false;
        });
    },

    rollUpMediaDescriptionPanels: function() {
        var that = this;
        that._caseStudyClickAnimating = true;

        if (!that._mediaDescPanelsOpen) {
            that._caseStudyClickAnimating = false;
            return;
        }

        //pause videos
        that.resetAllVideos();

        $('.mediaBox', that.el).slideUp(function() {
            that._mediaDescPanelsOpen = false;
        });

        //set scrolltop to 0
        that.scrollTopZero();

        $('.descBox', that.el).slideUp(function() {
            that._mediaDescPanelsOpen = false;
            that._caseStudyClickAnimating = false;


        });
    },

    scrollTopZero: function() {
        var index = 0;
        if (this._currentCaseStudyIndex == -1)
            index = 0;
        else
            index = this._currentCaseStudyIndex;

        $('.descBorder > div:nth-child(' + (index + 1) + ') .caseStudyDescContainer .descriptionBody', this.el).scrollTop(0);
    },

    changeLanguage: function(model) {
        var newLanguage = StimApp.model.get('currentLanguage');

        //hiding easter eggs for other languages. 
        //94 = Philly Jesus
        var krpano = document.getElementById('krpanoSWFObject');

        if (this.model.get('id') == 'POI94') {
            if (StimApp.model.get('currentLanguage') == 'en') {
                this.showPOI();
                krpano.get('hotspot[poi94]').visible = true;
            } else {
                this.closeTitleDescription();
                this.hidePOI();
                krpano.get('hotspot[poi94]').visible = false;
            }
        }

        //changing title as per language change
        this.model.set('title', this.model.get('titles')[newLanguage]);
        $('.poiTitleBG div', this.el).text(this.model.get('titles')[newLanguage]);

        //changing description as per language change
        this.model.set('description', this.model.get('descriptions')[newLanguage]);
        $('#descriptionText', this.el).text(this.model.get('descriptions')[newLanguage]);

    },

    monitorTouchEvents: function() {
        var that = this;
        $(this.el).on('pointerup pointerdown pointermove', function(e) {
            // if ($.contains($("#languagesView"), e.target) || e.target == $("#languagesView"))
            //     return;
            StimApp.model.resetTimer();
        });

        /*
                $('#poiIcon, .poiTitleBG, .poiTail, .poiTailSelected, #caseStudyBox, .descBox, .mediaBox, .descriptionBody, .descBreak, .descriptionTitle', this.el).on('pointerup pointerdown pointermove', function(e) {
                    // if ($.contains($("#languagesView"), e.target) || e.target == $("#languagesView"))
                    //     return;
                    console.log('resetTimer');
                    StimApp.model.resetTimer();
                });
                */
    },

    //Set case study option events

    setPOIDetailActions: function() {
        var that = this;
        $('.caseStudyList, .caseStudyOption, .actualOption', this.el).off();

        //Mousedown change background for options
        $('.caseStudyOption, .caseStudyList', this.el).on('mousedown touchstart', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (that._fadeInTransition)
                return;

            if (that._caseStudyBoxRollingUp) //while the animation is happening
                return;

            if (that._caseStudyBoxRolledUpCompletely) //once an option has been selected, it should not be clickable
                return;

            if (that._resetting)
                return;

            if (that._poiClickAnimating)
                return;

            that._fadeInTransition = true;
            that._mouseDown = true;

            $(e.target).removeClass('selectedOption');

            $(e.target).addClass('optionPress');
            //$(e.target).find('.optionLabel').css('color', 'rgba(65,64,66,1)');
        });

        $('.caseStudyOption', this.el).on('pointerleave', function(e) {
            e.stopPropagation();
            e.preventDefault();

            if (!that._mouseDown)
                return;

            that._fadeInTransition = false;
            that._mouseDown = false;

            if ($(e.target)[0] != $('.caseStudyList > div:nth-child(' + (that._currentCaseStudyIndex + 1) + ') .actualOption .caseStudyOption', that.el)[0])
                $(e.target).removeClass('optionPress');
        });

        $('.caseStudyOption', this.el).on('mouseup touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();

            if (!that._mouseDown)
                return;

            that._mouseDown = false;

            if (e.type == 'touchend') {
                that._fadeInTransition = false;
                // $(e.target).removeClass('optionPress');
            }
            var id = -1;

            id = $(e.target).parent().parent().index();

            //changing the value in AppModel to fire other events
            if (id === null || id === undefined)
                return;

            that._currentCaseStudyIndex = id;

            that._crossButtonAnimating = true;
            that.swapSelectedCaseStudyOption(e.target);
            that.selectDescriptionSwitch(id);
            that.selectMediaSwitch(id);
            that.moveBackButtonToFocus();

            if (that._currentCaseStudyIndex >= 0)
                ampm.logEvent('poi', 'caseStudy', that.model.get('caseStudies')[that._currentCaseStudyIndex].caseStudyName.en); //Analytics
        });

        $('.crossIcon', this.el).on('mousedown touchstart', function(e) {
            e.stopPropagation();
            if (that._backButtonAnimating || that._crossButtonAnimating || that._resetting || that._poiClickAnimating)
                return;
            that._mouseDown = true;
            $(e.target).parent().css('transition', 'none');
            $(e.target).parent().css('transform', 'scale(1.15,1.15)');

            //$(e.target).css('transform', 'scale(1.15,1.15)');
        });

        $('.crossIcon', this.el).on('mouseup touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();

            if (!that._mouseDown)
                return;

            that._mouseDown = false;

            $(e.target).parent().css('transform', 'scale(1,1)');

            that.closeTitleDescription();
            that.resetAllVideos();
        });

        $('.crossIcon', this.el).on('pointerleave', function(e) {
            e.stopPropagation();

            if (!that._mouseDown)
                return;
            that._mouseDown = false;

            $(e.target).parent().css('transform', 'scale(1,1)');
        });


        $('.backIcon', this.el).on('mousedown touchstart', function(e) {
            e.stopPropagation();
            e.preventDefault();

            if (that._backButtonAnimating || that._resetting || that._crossButtonAnimating || that._poiClickAnimating)
                return;
            that._mouseDown = true;
            $(e.target).parent().css('transition', 'none');
            $(e.target).parent().css('transform', 'scale(1.15,1.15)');
        });

        $('.backIcon', this.el).on('mouseup touchend', function(e) {
            e.stopPropagation();
            if (!that._mouseDown)
                return;
            that._mouseDown = false;

            $(e.target).parent().css('transform', 'scale(1,1)');

            $(e.target).parent().css('transition', 'all 0.3s linear');
            that._backButtonAnimating = true;

            that.unswapAllCaseStudyOptions();
            that.moveCrossButtonToFocus();

            //reset backbutton animation flag after 0.3s
            setTimeout(function() {
                that._backButtonAnimating = false;
            }, 300);
        });

        $('.backIcon', this.el).on('pointerleave', function(e) {
            e.stopPropagation();

            if (!that._mouseDown)
                return;
            that._mouseDown = false;

            $(e.target).parent().css('transform', 'scale(1,1)');
        });

        //Click outside event
        /*
        $(document).on('pointerup', function(e) {
            var container = $(that.el);

            if (!container.is(e.target) && container.has(e.target).length === 0) // if the target of the click isn't the container...// ... nor a descendant of the container
            {
                that.hideOptions();
            }
        });
        */

        //Description Box events

        var clicked = false;
        var clickY = 0;
        var time = 0;
        var interval = null;
        var mouseLeft = false;
        var mouseLeftScrollTop = 0;

        $('.descriptionBody', that.el).on({
            'mousemove touchmove': function(e) {
                e.stopPropagation();

                StimApp.model.resetTimer();
                // e.preventDefault();
                if (mouseLeft)
                    e.preventDefault();

                if (clicked) {
                    var pos = $(e.target).parent().index() + 1;
                    updateScrollPos(e, pos);
                }

            },
            'mousedown touchstart': function(e) {

                e.stopPropagation();

                StimApp.model.resetTimer();

                mouseLeft = false;

                clicked = true;
                $(e.target).stop(false, false);
                if (e.type == 'mousedown') {
                    clickY = e.pageY;
                } else if (e.type == 'touchstart') {
                    clickY = e.originalEvent.touches[0].clientY;
                }


                time = 0;
                clearInterval(interval);
                interval = setInterval(function() {
                    time += 10;
                }, 10);
            },
            'mouseup touchend': function(e) {

                e.stopPropagation();

                StimApp.model.resetTimer();

                mouseLeft = false;

                if (!clicked)
                    return;

                var pos = $(e.target).parent().index() + 1;

                if (e.type == 'mouseup' || e.type == 'touchend') {
                    clicked = false;
                    clearInterval(interval);

                    momentumScroll(e, pos);
                    return;
                }

                var changedTouch = e.originalEvent.changedTouches[0];
                var elem = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
                //logic for touchup not touchleave
                if (!($.contains($(e.target), elem) || elem == that.el)) {
                    clicked = false;
                    clearInterval(interval);

                    momentumScroll(e, pos);
                } else // logic for touchleave
                {
                    clicked = false;
                    time = 0;
                    clearInterval(interval);
                }
            },
            'pointerleave': function(e) {

                e.stopPropagation();

                StimApp.model.resetTimer();
                if (!clicked) {
                    return;
                }

                e.preventDefault();
                mouseLeftScrollTop = $(e.target).scrollTop();
                mouseLeft = true;
                clicked = false;
                time = 0;
                clearInterval(interval);
            },
            'scroll': function(e) {
                StimApp.model.resetTimer();

                if (mouseLeft) {
                    $(e.target).scrollTop(mouseLeftScrollTop);
                }
                if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                    $('.descFadeOff', $(this).parent()).css('opacity', 0);
                } else {
                    $('.descFadeOff', $(this).parent()).css('opacity', 1);
                }
            }
        });

        var updateScrollPos = function(e, index) {
            var elem = e.target;

            $(elem).css('cursor', 'grab');
            if (e.type == 'mousemove') {
                $(elem).scrollTop($(elem).scrollTop() + (clickY - e.pageY));
                clickY = e.pageY;
            } else if (e.type == 'touchmove') {
                $(elem).scrollTop($(elem).scrollTop() + (clickY - e.originalEvent.touches[0].clientY));
                clickY = e.originalEvent.touches[0].clientY;
            }
        };

        var momentumScroll = function(e, index) {
            if (e.type == 'mouseup') {
                if (time === 0 || (clickY - e.pageY) / time === 0)
                    return;
            } else if (e.type == 'touchend') {
                if (time === 0 || (clickY - e.originalEvent.changedTouches[0].clientY) / time === 0)
                    return;
            }

            var elem = e.target;

            var speed = 500; //no.of pixels per second
            var scrollTop = $(elem).scrollTop();
            if (e.type == 'mouseup') {
                $(elem).animate({
                    scrollTop: scrollTop + (speed * (clickY - e.pageY) / time)
                }, Math.abs(1000 * (clickY - e.pageY) / time));
            } else if (e.type == 'touchend') {
                $(elem).animate({
                    scrollTop: scrollTop + (speed * (clickY - e.originalEvent.changedTouches[0].clientY) / time)
                }, Math.abs(1000 * (clickY - e.originalEvent.changedTouches[0].clientY) / time));
            }
        };


        $('.descBox', this.el).on('mousedown touchstart touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
        });

        //Media Box events
        $('.mediaBox', this.el).on('mousedown touchstart touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
        });
    },

    setPlayPauseFunctionality: function(element) {
        var that = this;
        var playButtons = element.getElementsByClassName('playButton');

        if (!playButtons)
            return;
        // Event listener for the play/pause button
        _.each(playButtons, function(playButton) {
            var video = playButton.parentNode.getElementsByTagName('video')[0];
            if (!video)
                return;
            var playX = -1;
            var playY = -1;
            var playOrPause = function(e) {
                if (e.type == "touchend") {
                    if ((Math.abs(e.changedTouches[0].pageX - playX) > that._playButtonThreshold) || (Math.abs(e.changedTouches[0].pageY - playY) > that._playButtonThreshold))
                        return;

                    playX = -1;
                    playY = -1;
                }

                if (video.paused) {
                    // Play the video
                    video.play();
                    that._currentlyPlayingVideo = video;
                    clearInterval(that._videoPlayResetAttractInterval);
                    that._videoPlayResetAttractInterval = setInterval(function() {
                        StimApp.model.resetTimer();
                    }, 100);
                    // Update the button text to 'Pause'
                    playButton.setAttribute("style", "display:none");
                } else {
                    // Pause the video
                    video.pause();
                    // that._currentlyPlayingVideo = null;
                    clearInterval(that._videoPlayResetAttractInterval);

                    // Update the button text to 'Play'
                    playButton.setAttribute("style", "display:block");
                }
            };

            video.addEventListener("click", playOrPause);
            video.addEventListener("touchstart", function(e) {
                playX = e.touches[0].clientX;
                playY = e.touches[0].clientY;
            });
            video.addEventListener("touchend", playOrPause);
            that.showFirstFrame(video);
        });

    },

    showFirstFrame: function(video) {
        //On video end switch to first frame and show play button
        var that = this;
        $(video).bind('ended', function() {
            this.load();
            that._currentlyPlayingVideo = null;
            clearInterval(that._videoPlayResetAttractInterval);

            $('.playButton', this.parent).show();
        });
    },

    resetAllVideos: function() {
        var that = this;
        var videos = this.el.getElementsByTagName('video');
        _.each(videos, function(video) {
            if (video.currentTime !== 0) {
                StimApp.model.resetTimer();
                video.load();
                that._currentlyPlayingVideo = null;
                clearInterval(that._videoPlayResetAttractInterval);
            }
            $('.playButton', video.parent).show();
        });
    },

    setFullScreenFunctionality: function(element) {
        var that = this;
        var mouseDown = false;
        var fullScreenButtons = element.getElementsByClassName('fullScreenButton');

        if (!fullScreenButtons)
            return;
        // Event listener for the play/pause button
        _.each(fullScreenButtons, function(fullScreenButton) {
            var video = fullScreenButton.parentNode.getElementsByTagName('video')[0];
            if (!video)
                return;

            var playX = -1;
            var playY = -1;

            var goFullScreen = function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (!mouseDown)
                    return;
                mouseDown = false;
                $(e.target).removeClass('fullScreenButtonPressed');

                if (e.type == "touchend") {
                    if ((Math.abs(e.changedTouches[0].pageX - playX) > that._playButtonThreshold) || (Math.abs(e.changedTouches[0].pageY - playY) > that._playButtonThreshold))
                        return;

                    playX = -1;
                    playY = -1;
                }

                that._currentlyPlayingVideo = video;
                StimApp.model.trigger('fullScreenClicked', video);
                clearInterval(that._videoPlayResetAttractInterval);
            };

            fullScreenButton.addEventListener("mousedown", function(e) {
                e.stopPropagation();
                e.preventDefault();
                mouseDown = true;
                $(fullScreenButton).addClass('fullScreenButtonPressed');
            });

            fullScreenButton.addEventListener("touchstart", function(e) {
                e.stopPropagation();
                e.preventDefault();
                playX = e.touches[0].clientX;
                playY = e.touches[0].clientY;
                mouseDown = true;
                $(fullScreenButton).addClass('fullScreenButtonPressed');
            });

            fullScreenButton.addEventListener("mouseup", goFullScreen);
            fullScreenButton.addEventListener("touchend", goFullScreen);

            fullScreenButton.addEventListener("pointerleave", function(e) {
                e.stopPropagation();
                e.preventDefault();
                mouseDown = false;
                $(fullScreenButton).removeClass('fullScreenButtonPressed');
            });


        });
    },

    returnToNormalScreen: function(video) {
        var that = this;
        if (this._currentlyPlayingVideo === null)
            return;
        if (video === null)
            return;
        if (video.getElementsByTagName('source')[0].src != this._currentlyPlayingVideo.getElementsByTagName('source')[0].src)
            return;

        if (video.paused) {
            if (video.currentTime === 0) {
                that._currentlyPlayingVideo.load();

            } else {
                // that._currentlyPlayingVideo.muted = true;
                that._currentlyPlayingVideo.load();
                that._currentlyPlayingVideo.currentTime = video.currentTime;
                that._currentlyPlayingVideo.pause();
                // that._currentlyPlayingVideo.muted = false;
            }
            that._currentlyPlayingVideo.parentNode.getElementsByClassName('playButton')[0].setAttribute("style", "display:block");
        } else {
            that._currentlyPlayingVideo.load();
            that._currentlyPlayingVideo.currentTime = video.currentTime;
            that._currentlyPlayingVideo.play();
            that._currentlyPlayingVideo.parentNode.getElementsByClassName('playButton')[0].setAttribute("style", "display:none");
            video.pause();

            clearInterval(this._videoPlayResetAttractInterval);
            this._videoPlayResetAttractInterval = setInterval(function() {
                StimApp.model.resetTimer();
            }, 100);
        }
    },

    selectDescriptionSwitch: function(index) {
        var that = this;
        if ($('.descBorder > div:nth-child(' + (index + 1) + ')', that.el).is(':visible')) {
            that._fadeInTransition = false;
            return;
        }

        that.rollDownDescriptionPanel();

        if (that._currDescIndex === index) {
            that._fadeInTransition = false;
            return;
        }

        that._currDescIndex = index;

        $('.descBorder > div', this.el).fadeOut(300, "swing", function() {
            setTimeout(function() {
                //set scrolltop to 0
                that.scrollTopZero();

                $('.descBorder > div:nth-child(' + (index + 1) + ')', that.el).fadeIn(300, function() {
                    that._fadeInTransition = false;
                });

                //disable fadeoff for non scrolling description body
                var element = $('.descBorder > div:nth-child(' + (index + 1) + ') .caseStudyDescContainer .descriptionBody', that.el);
                if ($(element).scrollTop() + $(element).innerHeight() >= $(element)[0].scrollHeight) {
                    $('.descFadeOff', $(element).parent()).css('opacity', 0);
                }

            }, 300);
        });
    },

    selectMediaSwitch: function(index) {
        var that = this;

        if ($('.mediaBorder > div:nth-child(' + (index + 1) + ')', that.el).is(':visible')) {
            that._fadeInTransition = false;
            return;
        }

        that.rollDownMediaPanel();

        if (that._currMediaIndex === index) {
            that._fadeInTransition = false;
            $('.mediaBorder > div:nth-child(' + (index + 1) + ') #imageBox', that.el).slick('slickGoTo', 0, true);
            return;
        }

        that._currMediaIndex = index;

        $('.mediaBorder > div', this.el).fadeOut(300, "linear", function() {
            setTimeout(function() {

                $('.mediaBorder > div:nth-child(' + (index + 1) + ')', that.el).fadeIn(300, function() {
                    that._fadeInTransition = false;
                });

                $('.mediaBorder > div:nth-child(' + (index + 1) + ') #imageBox', that.el).slick('slickGoTo', 0, true);

                that.resetAllVideos();
            }, 300);
        });
    },

    swapSelectedCaseStudyOption: function(target) {
        // $('.caseStudyOption', this.el).removeClass('optionPress');
        //remove optionpress for all other case studies and enable it for the current one
        _.each($(target).parent().parent().parent().children('.csOptionContainer'), function(child) {
            $('.actualOption .caseStudyOption', $(child)).removeClass('optionPress');
        });
        $(target).addClass('optionPress');
        this._caseStudyBoxRollingUp = true;

        //Roll back the other case study options
        var that = this;
        var divs = $('.caseStudyList > div', this.el);
        $.each(divs, function(i, val) {
            if ($(val) == $(target) || $.contains(val, target)) {
                return;
            }
            $(val).slideUp(function() {
                that._caseStudyBoxRollingUp = false;
                that._caseStudyBoxRolledUpCompletely = true;
                that._crossButtonAnimating = false;
            });
            that.roundSelectedCaseStudyEdges(target);
        });
    },

    roundSelectedCaseStudyEdges: function(target) {
        $(target).css('border-radius', '5px 5px 5px 5px');
    },

    roundCaseStudyListEdges: function() {
        //Setting custom border-radius to the top and bottom case study options
        if (this.model.get('caseStudies').length == 1) {
            $('.caseStudyList div:first-child .actualOption .caseStudyOption', this.el).css('border-radius', '5px 5px 5px 5px');
            return;
        }

        $('.caseStudyList div:first-child .actualOption .caseStudyOption', this.el).css('border-radius', '5px 5px 0px 0px');
        $('.caseStudyList div:last-child .actualOption .caseStudyOption', this.el).css('border-radius', '0px 0px 5px 5px');
    },

    moveBackButtonToFocus: function() {
        $('.crossIcon', this.el).css('pointer-events', 'none');
        $('.backIcon', this.el).css('pointer-events', 'auto');
        $('.crossIcon img', this.el).css('transform', 'translate(-60px,0px)');
        $('.backIcon img', this.el).css('transform', 'translate(0px,0px)');
    },

    moveCrossButtonToFocus: function() {
        $('.crossIcon', this.el).css('pointer-events', 'auto');
        $('.backIcon', this.el).css('pointer-events', 'none');
        $('.crossIcon img', this.el).css('transform', 'translate(0px,0px)');
        $('.backIcon img', this.el).css('transform', 'translate(60px,0px)');
    },

    unswapAllCaseStudyOptions: function() {
        var that = this;
        var divs = $('.caseStudyList > div', this.el);
        $.each(divs, function(i, val) {
            $(val).slideDown(function() {
                that._caseStudyBoxRolledUpCompletely = false;
            });
            $('.caseStudyOption', val).css('border-radius', '0px');
        });

        that.roundCaseStudyListEdges();
    },
});
