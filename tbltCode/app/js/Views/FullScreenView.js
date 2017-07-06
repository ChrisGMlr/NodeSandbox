StimApp.Views.FullScreenView = Backbone.View.extend({
    _playButtonThreshold: 14,
    _videoPlayResetAttractInterval: null,
    _currentlyPlayingVideo: null,
    _originalVideo: null,
    _mouseDown: false,
    defaults: {
        model: StimApp.Models.FullScreenModel,
    },

    initialize: function() {
        var that = this;
        this.render();
        this.listenTo(StimApp.model, 'fullScreenClicked', this.goFullScreen);
        this.setTouchStatesForVideo();

        $('.normalScreenButton', this.el).on('mousedown touchstart', function(e) {
            e.stopPropagation();
            e.preventDefault();
            that._mouseDown = true;
            $(this).addClass('normalScreenButtonPressed');
        });

        $('.normalScreenButton', this.el).on('mouseup touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).removeClass('normalScreenButtonPressed');

            if (!that._mouseDown)
                return;
            that._mouseDown = false;


            StimApp.model.trigger('normalScreenClicked', that._currentlyPlayingVideo);
            that._currentlyPlayingVideo = null;
            that._originalVideo = null;
            $('.fullScreenVideo', this.el).css('opacity', 0);
            $('.fullScreenVideo', this.el).css('pointer-events', 'none');
            clearInterval(that._videoPlayResetAttractInterval);
        });

        $('.normalScreenButton', this.el).on('pointerleave', function(e) {

            e.stopPropagation();
            e.preventDefault();
            that._mouseDown = false;
            $(this).removeClass('normalScreenButtonPressed');
        });

        this.showFirstFrame();
    },

    showFirstFrame: function() {
        //On video end switch to first frame and show play button
        var that = this;
        var video = $('.poiVideoFullScreen', this.el)[0];
        $(video).bind('ended', function() {
            this.load();
            $('.fullScreenPlayButton', this.el).css('display', 'block');
        });
    },

    setTouchStatesForVideo: function() {
        var that = this;
        var mouseDown = false;
        var video = $('.poiVideoFullScreen', this.el)[0];
        if (!video)
            return;
        var playX = -1;
        var playY = -1;
        var playOrPause = function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (!mouseDown)
                return;
            mouseDown = false;
            //if (e.type == "touchend") {
            if ((Math.abs(e.pageX - playX) > that._playButtonThreshold) || (Math.abs(e.pageY - playY) > that._playButtonThreshold))
                return;

            playX = -1;
            playY = -1;
            // }

            if (video.paused) {
                // Play the video
                video.play();
                that._currentlyPlayingVideo = video;
                // Update the button text to 'Pause'
                $('.fullScreenPlayButton', this.el).css('display', 'none');
            } else {
                // Pause the video
                video.pause();
                // Update the button text to 'Play'
                $('.fullScreenPlayButton', this.el).css('display', 'block');
            }
        };

        video.addEventListener("pointerup", playOrPause);
        video.addEventListener("pointerdown", function(e) {
            e.stopPropagation();
            e.preventDefault();
            mouseDown = true;
            playX = e.pageX;
            playY = e.pageY;
        });

    },

    goFullScreen: function(video) {
        var url = video.getElementsByTagName('source')[0].src;
        var posterURL = video.poster;
        this._originalVideo = video;
        $('.poiVideoFullScreen > source', this.el).attr('src', url);
        $('.poiVideoFullScreen', this.el).attr('poster', posterURL);


        var fullScreenVideo = $('.fullScreenVideo .poiVideoFullScreen').get(0);
        if (video.paused) {
            if (video.currentTime === 0) {
                fullScreenVideo.load();
            } else {
                // fullScreenVideo.muted = true;
                fullScreenVideo.load();
                fullScreenVideo.currentTime = video.currentTime;
                fullScreenVideo.pause();
                // fullScreenVideo.muted = false;
            }
            $('.fullScreenPlayButton', this.el).css('display', 'block');
        } else {
            fullScreenVideo.load();
            fullScreenVideo.currentTime = video.currentTime;
            fullScreenVideo.play();
            video.pause();

            $('.fullScreenPlayButton', this.el).css('display', 'none');
        }
        this._currentlyPlayingVideo = fullScreenVideo;

        $('.fullScreenVideo', this.el).css('opacity', 1);
        $('.fullScreenVideo', this.el).css('pointer-events', 'auto');
        //Keep Resetting Attract in Full screen
        clearInterval(this._videoPlayResetAttractInterval);
        this._videoPlayResetAttractInterval = setInterval(function() {
            StimApp.model.resetTimer();
        }, 100);
    },

    render: function() {
        this.$el.append(Mustache.render($('#fullScreenTemplate').html(), this.model));
        return this;
    },
});