
var calibrate = {
    // tracks whether the start dialog has already been displayed during this session
    startDialogShown: false,
    calibrating: false,

    initialize: function() {
        var me = this;

        lifeSizeViewer.on('startCalibration', function() {
            // don't kick off calibration if currently already calibrating
            if (!me.calibrating) {
                me.calibrating = true;
                me.start();
            } else {
                LsLog.info("calibration already in progress");
            }
        });
        lifeSizeViewer.on('openCalibrationView', function() {
            calibrationScreen.show();
        });
        lifeSizeViewer.on('calibrationCanceled calibrationComplete', function() {
            me.calibrating = false;
        })
    },

    start: function() {
        // open suggestDialog if we have screen matches
        var matches = lsScreen.get('matches');
        if (matches && matches.length > 1) {
            // we have screen matches
            suggestDialog.show();
        } else if (!this.startDialogShown) {
            // start dialog hasn't been shown yet during this session
            startCalibrationDialog.show();
            this.startDialogShown = true;
        } else {
            // show the calibration screen
            calibrationScreen.show();
        }
    }
}


/**
 * this is the model for the dialog that handles the screen suggestions for Mac users
 */
var suggestDialog = {
    initialized: false,

    // initialize the event handlers for the dialog
    initialize: function() {
        var me = this;
        me.initialized = true;
        // initialize close handler - not visible at the moment
        //$('#suggestions-dialog .dialog-close-button').click(function() {
        //    me.hide();
        //});
        // add handler for continue and 'not now' button
        $('#suggest-btn-continue').click(function() {
            var selected = $('#suggestions-dialog input:radio[name=screenType]:checked').val();

            _gaq.push(['_trackEvent', 'Calibrate', 'ScreenType', selected]);
            me.hide();
            if (selected == 'other') {
                lifeSizeViewer.trigger('openCalibrationView');
            } else {
                me._knownScreenSelected(selected);
            }
        });
        $('#suggest-btn-cancel').click(function() {
            _gaq.push(['_trackEvent', 'Calibrate', 'NotNowForSuggestions']);
            me.hide();
            lifeSizeViewer.trigger('calibrationCanceled');
        });
    },

    // display the suggest dialog
    show: function() {
        if (!this.initialized) {
            // init first if necessary
            this.initialize();
        }
        this._populateSuggestions();

        $('#lightbox').fadeIn(200, function() {
            $('#suggestions-dialog').show();
        });
    },

    // hide the suggest dialog
    hide: function(leaveBackgroundFaded) {
        $('#suggestions-dialog').hide();
        if (!leaveBackgroundFaded) {
            $('#lightbox').fadeOut();
        }
    },

    // populates the list of suggestions in the dialog
    _populateSuggestions: function() {
        var form = $('#suggestions-form form');
        form.empty();

        $.each(lsScreen.get('matches'), function(i,val) {
            form.append('<div><input type="radio" name="screenType" value="' + val.n + '" id="' + val.n + '"/><label for="' + val.n + '">' + val.t + '</label></div>');
        });
        // select current screen name in list
        var item = $('#suggestions-dialog input:radio[name=screenType][value='+ lsScreen.get('name') + ']');
        if (item.length > 0) {
            // found radio button for current screen name
            item.prop('checked', true);
        } else if (!lsScreen.get('cal')) {
            // no match and screen not yet calibrated, select the first in the list
            $('#suggestions-dialog input:radio[name=screenType]:first').prop("checked", true);
        } else {
            // no match but screen is calibrated, select the last in the list
            $('#suggestions-dialog input:radio[name=screenType]:last').prop("checked", true);
        }
    },

    _knownScreenSelected: function(selected) {
        var data = { name: selected, user: LsView.userId, ref: LsImages.img[0].ref, imgUser: LsImages.img[0].uid };

        $.post('/calibrate/save_known', data, function(data) {
            if (data.status == 'ok') {
                LsLog.info("known screen saved, response:", data);
                //updateScreen(data.ppi, data.lsw, data.lsh);
            }
        });

        if (!lsScreen.get('cal')) {
            // screen wasn't calibrated yet... track conversion
            _gaq.push(['_trackEvent', 'View', 'ConvertedWithKnownScreen']);
        } else {
            _gaq.push(['_trackEvent', 'View', 'RecalibratedWithKnownScreen']);
        }

        // update the LsScreen model with the selected screen
        $.each(lsScreen.get('matches'), function(i,screen) {
            if (screen.n == selected) {
                lsScreen.set( {name:screen.n, ppi: screen.ppi, cal: true} );
            }
        });
        lifeSizeViewer.trigger('calibrationComplete');
    }
};

/**
 * this is the model for the start calibrate dialog (for windows users)
 */
var startCalibrationDialog = {
    initialized: false,

    // initialize the event handlers for the dialog
    initialize: function() {
        var me = this;
        me.initialized = true;
        // initialize close handler - not visible at the moment
        //$('#suggestions-dialog .dialog-close-button').click(function() {
        //    me.hide();
        //});
        // add handler for continue and 'not now' button
        $('#start-btn-continue').click(function() {
            me.hide();
            lifeSizeViewer.trigger('openCalibrationView');
        });
        $('#start-btn-cancel').click(function() {
            _gaq.push(['_trackEvent', 'Calibrate', 'NotNow']);
            me.hide();
            lifeSizeViewer.trigger('calibrationCanceled');
        });
    },

    // display the dialog
    show: function() {
        if (!this.initialized) {
            // init first if necessary
            this.initialize();
        }

        $('#lightbox').fadeIn(200, function() {
            $('#calibration-start-dialog').show();
        });
    },

    // hide the dialog
    hide: function(leaveBackgroundFaded) {
        $('#calibration-start-dialog').hide();
        if (!leaveBackgroundFaded) {
            $('#lightbox').fadeOut();
        }
    }
};

/**
 * functionality for the actual calibration screen
 */
var calibrationScreen = {
    initialized: false,     // set to true on initialization
    current: null,          // current calibration object
    visible: false,

    // calibration images and metadata
    calImageCfg: {
        dollar:       { width: 1200, height: 503,  ppi: 195.4, name: 'dollar',     type: 'png',  thumbWidth: 500, thumbHeight: 209, scale: .45, kc: false},
        cd:           { width: 1032, height: 1032, ppi: 220,   name: 'cd',         type: 'png',  thumbWidth: 300, thumbHeight: 300, scale: .55, kc: true},
        creditcard:   { width: 850,  height: 536,  ppi: 247.2, name: 'creditcard', type: 'jpg',  thumbWidth: 500, thumbHeight: 315, scale: .4,  kc: false},
        measure:      { width: 2459, height: 218,  ppi: 202.6, name: 'measure',    type: 'png',  thumbWidth: 500, thumbHeight: 250, scale: .4,  kc: false}
    },

    // initialize the event handlers for the dialog
    initialize: function() {
        var me = this;
        me.initialized = true;

        // zoom in image slightly on hover
        me._setUpImageHoverEffect();

        // highlight title text on hover
        $('.calibration-image').hover(function() {
          var id = $(this).attr('id');
          $('#' + id + "-txt").addClass('highlight');
        }, function() {
          var id = $(this).attr('id');
          $('#' + id + "-txt").removeClass('highlight');
        });

        $('.calibration-image').click(this.imageSelected);

        // set up slider
        this._setUpSlider();

        // set up mouse/keyboard control handler
        $(document).listenControls(function(delta) {
            if (me.visible) {
                // move the slider
                var value = $("#cal-slider").slider( "option", "value" ) + delta/3;
                $("#cal-slider").slider( "option", "value", value);
                me._updateCalZoom(value);
            }
        });

        // set up click handlers for buttons
        $('#calibrate-btn-cancel').click(function() {
            _gaq.push(['_trackEvent', 'Calibrate', 'CancelCalibration']);
            me.hide();
            lifeSizeViewer.trigger('calibrationCanceled');
        });
        $('#calibrate-btn-back').click(function() {
            _gaq.push(['_trackEvent', 'Calibrate', 'BackToSelectMethod']);
            me.show();
        });
        $('#calibrate-btn-finish').click(function() {
            _gaq.push(['_trackEvent', 'Calibrate', 'Finish', me.current]);
            me._saveCalibration();
            me.hide();
        });
        lifeSizeViewer.on('viewerResized', function() {
            if (me.visible)
                me._positionImages();
        })
    },

    /**
     * displays the calibration image selection view
     */
    show: function() {
        if (!this.initialized) {
            // init first if necessary
            this.initialize();
        }
        this.visible = true;

        // resize window if necessary
        var width  = Math.min(1000, screen.availWidth);
        var height = Math.min(800, screen.availHeight);
        lifeSizeViewer.trigger('resizeWindow', width, height);

        this._positionImages();

        _gaq.push(['_trackEvent', 'Calibrate', 'Start']);

        $('.step-one').slideDown('slow');
        $('.step-two').hide();
        $('#full-cal-image').hide();
        $('#cal-slider').hide();
        $('#full-cal-image').attr('src', null); // remove src for later reuse of this element
        $('.calibration-image').show();
        $('.calTitle').show();
        $('#btn-step-one').show();
        $('#btn-step-two').hide();

        $('#calibration-view').fadeIn(500);
    },

    /**
     * hides the calibration screen
     */
    hide: function() {
        this.visible = false;
        $('#calibration-view').fadeOut(500);
    },

    /**
     * saves the calibration data with the server and fires the calibrationComplete event
     * when finished.
     */
    _saveCalibration: function() {
        var current = calibrationScreen.current;
        var img = calibrationScreen.calImageCfg[current];
        var ls = $('#full-cal-image');
        var formData = {
            img:    current,
            wc:     img.width,
            ws:     ls.width(),
            p:      img.ppi,
            z:      lsScreen.get('browserZoom'),
            user:   LsView.userId
        }
        $.post('/calibrate/save', formData, function(data) {
            //console.log('received response:');
            //console.dir(data);
            if (data.status == 'ok') {
                if (!lsScreen.get('cal')) {
                    // screen wasn't calibrated yet... track conversion
                    _gaq.push(['_trackEvent', 'View', 'Converted']);
                } else {
                    _gaq.push(['_trackEvent', 'View', 'Recalibrated']);
                }
                lsScreen.set({ppi: data.ppi, name: null, cal: true});
                lifeSizeViewer.trigger('calibrationComplete');
            }
        });
    },

    /** handles render size update for calibration image */
    _updateCalZoom: function(scale) {
        var ls = $('#full-cal-image');
        if (calibrationScreen.current) {
            var img = calibrationScreen.calImageCfg[calibrationScreen.current];
            var posData = calibrationScreen._calculatePositionData(calibrationScreen.current, scale);
            ls.width(posData.width);
            ls.height(posData.height);
            if (img.kc) { // Keep Centered
                ls.css('top', posData.top + "px").css('left', posData.left + "px");
            }
        }
    },

    /** positions all calibration images */
    _positionImages: function() {
        var distanceFromCenter = 30;
        var distanceFromTop = 80;
        var rowDistance = 0;
        var boxSize = 220; // size of box to center images within
        var images = [this.calImageCfg.creditcard, this.calImageCfg.cd, this.calImageCfg.dollar, this.calImageCfg.measure];
        var totalWidth = $('#image-selection').parent().width();
        var fullSizeImages = [];
        for (var row=0; row<2; row++) {
            for (var col=0; col<2; col++) {
                var img = images[col + row*2];
                var srcUrl = LifeSizer.assetHost + '/img/view/calibrate/ref/' + img.name + "-sm." + img.type;
                fullSizeImages.push(LifeSizer.assetHost + '/img/view/calibrate/ref/' + img.name + "." + img.type);
                var elem = $('#' + img.name);
                var renWidth = img.thumbWidth * img.scale;
                var renHeight = img.thumbHeight * img.scale;
                elem.attr('src', srcUrl).attr('width', renWidth).attr('height', renHeight);
                // boxLeft and boxTop represent position of the (virtual) box that the image thumbnails sit in
                var boxLeft = totalWidth/2;
                if (col == 0) {
                    boxLeft = boxLeft - boxSize - distanceFromCenter;
                } else {
                    boxLeft = boxLeft + distanceFromCenter;
                }
                var boxTop = distanceFromTop + row*(boxSize+rowDistance);

                var imgLeft = (boxLeft + (boxSize - renWidth)/2);
                var imgTop = (boxTop + (boxSize - renHeight)/2);
                elem.css('left', imgLeft + 'px');
                elem.css('top',  imgTop + 'px');
                // track position
                img.left = imgLeft;
                img.top  = imgTop;

                // now position the text underneath
                var imgTxt = $('#' + img.name + '-txt');
                var verTextOffset = (row == 0) ? 20 : 40;
                imgTxt.css('left', boxLeft).css('top', (boxTop + boxSize-verTextOffset) + 'px');
            }
        }
        // preload the high res versions
        $(fullSizeImages).each(function(){
            (new Image()).src = this;
        });
    },

    /**
     * this handler gets called when an image is clicked. This zooms in the image and proceeds the
     * user to the actual calibration step.
     */
    imageSelected: function() {
        // hide all text labels and buttons
        $('.calTitle').hide();
        $('#btn-step-one').hide();
        // hide all other images
        var thumb = $(this);
        var id = thumb.attr('id');
        calibrationScreen.current = id;
        _gaq.push(['_trackEvent', 'Calibrate', 'SelectMethod', id]); // track the calibration method

        $('.calibration-image').each(function() {
            var img = $(this);
            if (img.attr('id') != id) {
                img.hide();
            }
        });
        // put high-res image right on top of thumbnail
        var img = calibrationScreen.calImageCfg[id];
        var srcUrl = LifeSizer.assetHost + '/img/view/calibrate/ref/' + img.name + "." + img.type;
        var calImg = $('#full-cal-image');
        calImg.hide();
        calImg.attr('src', srcUrl);
        calImg.height(thumb.height()).width(thumb.width());
        calImg.css('top', thumb.css('top')).css('left', thumb.css('left'));
        calImg.show();
        // calculate position to move image to

        // animate movement and start step 2
        var posData = calibrationScreen._calculatePositionData(id);
        thumb.hide();
        calImg.animate({
                  width:  posData.width + 'px',
                  height: posData.height + 'px',
                  top:    posData.top + 'px',
                  left:   posData.left + 'px'
              }, 800, function() { calibrationScreen.stepTwo(id); });
    },

    /**
     * sets up the calibration slider
     */
    _setUpSlider: function() {
        var me = this;
        $("#cal-slider").slider({
            min: 10,
            max: 300,
            step: 0.3,
            value: 100,
            slide: function(event, ui) {
                me._updateCalZoom(ui.value);
            }
        });
    },

    /**
     * starts step two, where the user does the actual calibration
     */
    stepTwo: function(name) {
        $("#cal-slider").slider( "option", "value", 100).show();

        // change text
        $('.step-one').slideUp('fast', function(){
            $('#step2_'+name).slideDown('fast');
        });

        $('#btn-step-two').show();
    },

    /** zooms thumbnails slightly on hover */
    _setUpImageHoverEffect: function() {
        var me = this;
        $('img.calibration-image').hover(function() {
            // on hover
            var cur = $(this);
            var name = cur.attr('id');
            var img = me.calImageCfg[name];

            var fact = 1.1;
            var imgWidth = img.thumbWidth * img.scale;
            var imgHeight = img.thumbHeight * img.scale;
            var newWidth = imgWidth * fact;
            var newHeight = imgHeight * fact;

            cur.animate({
                width:      newWidth,
                height:     newHeight,
                left:       (img.left - ((newWidth - imgWidth) / 2)) + "px",
                top:        (img.top - ((newHeight - imgHeight) / 2)) + "px"
            }, 200);
        }, function() {
            // on end hover
            var cur = $(this);
            var name = cur.attr('id');
            var img = me.calImageCfg[name];

            cur.animate({
                width:      img.thumbWidth * img.scale,
                height:     img.thumbHeight * img.scale,
                top:        img.top,
                left:       img.left
            }, 200 );
        });
    },

    /**
     * calculates position data for image with specified name, indicating
     * where the image should be displayed, based on current screen size and ppi
     * Returned object contains properties
     * top, left, width and height
     * @param name
     * @return hash containing width, height, top and left properties
     */
    _calculatePositionData: function(name, scale) {
        var scale = scale || 100;
        var topMargin = 100;
        var c = this.calImageCfg[name];
        var w = this._lsDim(c.width, c, scale);
        var h = this._lsDim(c.height, c, scale);
        var l, t;
        if (c.kc) {
            var win = $('#main');
            l = Math.round((win.width() - w) / 2);
            t = Math.round((win.height() - topMargin - h) / 2) + topMargin;
        } else {
            // if not keeping centered, use absolute value
            l = 50;
            t = 130;
        }
        return { width: w, height: h, top: t, left: l };
    },

    /**
     * calculates size at which to render image
     * @param val dimension (height or width)
     * @param c the configuration (one of the values in cfg hash)
     * @param scale scale at which to render, 100 if not specified
     * @return render dimension
     */
    _lsDim: function(val, c, scale) {
        return Math.round((val * lsScreen.get('ppi') * scale) / (c.ppi * 100));
    }
};