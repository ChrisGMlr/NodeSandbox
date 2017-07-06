StimApp.Views.HelpView = Backbone.View.extend({

    _mousedown: false,
    defaults: {
        model: StimApp.Models.HelpModel,
    },

    initialize: function() {
        this.render();
        this.listenTo(StimApp.model, 'change:currentStrings', this.render);
        var boundFunction = _.bind(this._onHelpButtonClicked, this);
        this.$el.on("pointerup", boundFunction);
        //         document.getElementById('helpView').addEventListener("pointerup", boundFunction);

    },

    _onHelpButtonClicked: function(e) {
        if (!this._mousedown)
            return;

        this._mousedown = false;
        if (!$('#helpOverlayView').hasClass('inactive')) {
            ampm.logEvent('ui', 'help', 'exit'); //Analytics
            $('#helpButton', this.el).removeClass('buttonPress');
        } else {
            ampm.logEvent('ui', 'help', 'enter'); //Analytics
        }
        StimApp.model.set('isInHelp', !StimApp.model.get('isInHelp'));

        //this.closeButtonToggle();
    },

    //Show the help button
    render: function() {
        var that = this;
        this.$el.children().remove(); //Remove all child elements and rerender
        this.$el.append(Mustache.render($('#helpTemplate').html(), StimApp.model.get('currentStrings')));
        $('#closeButton').css('display', 'none'); //hiding the close button at the beginning

        //Mousedown highlight
        $('#helpButton', this.$el).on('pointerdown', function(e) {
            that._mousedown = true;
            $('#helpButton', this.el).addClass('buttonPress');
            //$('#helpButton div', this.el).css('color', 'black');
            //$('#helpButton path', this.el).attr('stroke', 'black');
            //$('#helpButton circle', this.el).attr('fill', 'black');
        });

        $('#closeButton', this.$el).on('pointerdown', function(e) {
            that._mousedown = true;
            $('#closeButton', this.el).addClass('buttonPress');
            $('#closeButton div', this.el).css('color', 'black');
            $('#closeButton line', this.el).attr('stroke', 'black');
            $('#closeButton line:nth-of-type(2)', this.el).attr('stroke', 'black');
        });


        $('#helpButton', this.$el).on('pointerup pointerleave', function(e) {
            if (e.type == 'pointerleave') {
                that._mousedown = false;

                if ($('#helpOverlayView').hasClass('inactive'))
                    $('#helpButton', this.el).removeClass('buttonPress');
            }
            //Mouseup remove hightlight for Help Button
            //$('#helpButton', this.el).removeClass('buttonPress');
            //$('#helpButton div', this.el).css('color', 'white');
            //$('#helpButton path', this.el).attr('stroke', 'white');
            //$('#helpButton circle', this.el).attr('fill', 'white');
        });


        $('#closeButton', this.$el).on('pointerup pointerleave', function(e) {
            if (e.type == 'pointerleave')
                that._mousedown = false;
            //Mouseup remove hightlight for Help Button
            $('#closeButton', this.el).removeClass('buttonPress');
            $('#closeButton div', this.el).css('color', 'white');
            $('#closeButton line', this.el).attr('stroke', 'white');
            $('#closeButton line:nth-of-type(2)', this.el).attr('stroke', 'white');
        });

        this.resetActions();
    },

    resetActions: function() {
        $('#helpButton, #closeButton', this.el).on('pointerup pointerdown pointermove', function(e) {
            StimApp.model.resetTimer();
        });
    },

    closeButtonToggle: function() {
        //Mouseup remove hightlight for Close Button
        $('#closeButton', this.el).removeClass('buttonPress');
        $('#closeButton div', this.el).css('color', 'white');
        $('#closeButton line', this.el).attr('stroke', 'white');
        $('#closeButton line:nth-of-type(2)', this.el).attr('stroke', 'white');

        if ($('#helpButton').is(':visible')) {
            $('#helpButton').css('display', 'none');
            $('#closeButton').css('display', 'inline');
        } else {
            $('#helpButton').css('display', 'inline');
            $('#closeButton').css('display', 'none');
        }

    },

});