
var _gaq = _gaq || []; // if not defined yet
/*
if (window.console) {
    _gaq.push = function(arr) {
        arr.shift();
        var msg = "TRACK: " + arr[0] + " - " + arr[1];
        if (arr.length > 2) {
            msg = msg + " (" + arr[2] + ")";
        }
        console.log(msg);
    }
} */

/**
 * LifeSizeScreen model
 */
var LifeSizeScreen = Backbone.Model.extend({
    initialize: function() {
        this.set('zoom', 100);
        this.set('browserZoom', 1.0);
    },

    /**
     * calculates and returns the diameter in inches of the current screen
     * */
    diameter: function() {
        var ppi = this.get('ppi');
        var wi = this.get('res')[0] / this.get('ppi');
        var hi = this.get('res')[1] / this.get('ppi');
        return Math.round(Math.sqrt(wi*wi + hi*hi) * 100) / 100;
    },

    /**
     * looks up a screen match by name
     */
    find_match_by_name: function(name) {
        var title = null;
        $.each(this.get('matches'), function(i, val) {
            if (val.n == name) {
                title = val.t;
            }
        });
        return title;
    },

    calibrated: function(ppi, name) {
        this.set({
            ppi: ppi, cal: true, name: name
        });
    },
});

/**
 * handles state of measure tools and events
 */
var MeasureTools = Backbone.Model.extend({
    initialize: function() {
        var me = this;
        // tie click handler to open/close measure bar
        $('#settings-button').click(function() {
            var show = !me.get('measureBarVisible');
            me.showMeasureBar(show);
            if (show)
                me.delayedCloseMeasureBar(5);
        });

        var r = $('#ruler');
        // control grid on/off
        $('#grid-control').click(function() {
            var gridVisible = !me.get('gridVisible');
            if (gridVisible) {
                _gaq.push(['_trackEvent', 'MeasureTools', 'GridOn']);
                $('#grid-control').removeClass('grid-ruler-off').addClass('grid-ruler-on');
            } else {
                _gaq.push(['_trackEvent', 'MeasureTools', 'GridOff']);
                $('#grid-control').removeClass('grid-ruler-on').addClass('grid-ruler-off');
            }
            r.rulergrid('showGrid', gridVisible);
            me.set('gridVisible', gridVisible);
            me.delayedCloseMeasureBar(5);
        });
        // control ruler on/off
        $('#ruler-control').click(function() {
            var rulerVisible = !me.get('rulerVisible');
            if (rulerVisible) {
                _gaq.push(['_trackEvent', 'MeasureTools', 'RulerOn']);
                $('#ruler-control').removeClass('grid-ruler-off').addClass('grid-ruler-on');
            } else {
                _gaq.push(['_trackEvent', 'MeasureTools', 'RulerOff']);
                $('#ruler-control').removeClass('grid-ruler-on').addClass('grid-ruler-off');
            }
            r.rulergrid('showRulers', rulerVisible);
            me.set('rulerVisible', rulerVisible);
            me.delayedCloseMeasureBar(5);
        });

        $('#measure-tools').hover(function() {
            me.mouseHover = true;
        }, function() {
            me.mouseHover = false;
        });

        // canvas isn't draggable but the lifesize image underneath is.
        // pass mouse event to that element
        r.mousedown(function(event) {
            // TODO: this won't work when we start displaying multiple images in the viewer. Would need
            // to trigger event only on item that mouse is over
            $('.lifesize').trigger(event);
        });

        this.setupGridControls();
    },

    /**
     * initializes grid and sets up handlers for updating size
     */
    setupGridControls: function() {
        // initialize grid
        var relem = $('#ruler');
        var r = relem.rulergrid('init', lsScreen.get('ppi'));
        if (metric)
            relem.rulergrid('metric', true);

        function updateGridPpi() {
            $('#ruler').rulergrid('update', lsScreen.get('ppi'), lsScreen.get('zoom'));
        }
        // on zoom update or screen change
        lifeSizeViewer.on('screenChanged', updateGridPpi);
        lsScreen.on('change:zoom', updateGridPpi);

        // redraw grid/ruler on resize of popup
        lifeSizeViewer.on('viewerResized calibrationComplete', function() {
            $('#ruler').rulergrid('updateSize', lsScreen.get('ppi'), lsScreen.get('zoom'));
        });
    },

    /**
     * displays or hides the (vertical) measure toolbar
     * @param state
     */
    showMeasureBar: function(state) {
        if (state) {
            $('#measure-tools').slideDown(300);
        } else {
            $('#measure-tools').slideUp(300);
        }
        this.set('measureBarVisible', state);
    },

    /**
     * closes the measure bar after a given number of seconds.
     * @param secs number of seconds to wait before closing bar
     */
    delayedCloseMeasureBar: function(secs) {
        var me = this;
        $.delayedTask("closeMeasureBar", (secs * 1000), function() {
            if (!me.mouseHover) {
                me.showMeasureBar(false);
            } else {
                me.delayedCloseMeasureBar(secs); // wait longer
            }
        });
    }
});

/**
 * initializes everything
 */
$(function() {
    // http://stackoverflow.com/questions/7825448/webkit-issues-with-event-layerx-and-event-layery
    // remove layerX and layerY
    /** now fixed in jquery 1.7
    var all = $.event.props,
        len = all.length,
        res = [];
    while (len--) {
      var el = all[len];
      if (el != 'layerX' && el != 'layerY') res.push(el);
    }
    $.event.props = res;
    */

    // add screenData properties to LsScreen
    //$.extend(LsScreen, screenData);
    //LsScreen.setScreenMatches(screenMatches);

    lsScreen = new LifeSizeScreen(screenData);
    lsScreen.set('matches', screenMatches);

    lifeSizeViewer = new LifeSizeViewer();
    measureTools = new MeasureTools();

    // Log events
    lifeSizeViewer.on('all', function(event) {
        LsLog.info("EVENT LifeSizeViewer: " + event);
    });

    // make the lifesize image draggable
    $('.lifesize').draggable();
    // now make sure window size is correct
    lifeSizeViewer.trigger('resizeWindow');
    // recenter is triggered by resize so no need to do that here anymore
    lifeSizeViewer.trigger('recenter');

    toolbar = new Toolbar();

    // create model objects and collection
    if (LsImages.img && LsImages.img.length > 1) {
        var images = [];
        $.each(LsImages.img, function(i, img){
            images.push(new LsImage(img));
        });
        var productImages = new LifeSizer.Collections.ImageCollection(images);
        var imageNavigator = new LifeSizer.Views.ImageNavigator({ collection: productImages });
        $('#image-navigator').html(imageNavigator.render().el);
    }

    setUpImageDisplay();

    calibrate.initialize();

    // track whether this view is calibrated
    if (!lsScreen.get('cal')) {
        _gaq.push(['_trackEvent', 'View', 'Uncalibrated']);
    } else {
        _gaq.push(['_trackEvent', 'View', 'Calibrated']);
    }

    // handle mouse/trackpad/cursor zoom
    $(document).listenControls(function(delta) {
        // if in calibration mode, ignore this event
        if (calibrate.calibrating) {
            return;
        }
        LsLog.debug("delta = " + delta);
        var curZoom = lsScreen.get('zoom');
        // use continuousZoom because we don't want to repaint the grid on every single zoom event
        // (a whole string of these may fire when using wheel or trackpad)
        toolbar.continuousZoom(curZoom + delta);
        // set the zoom (to trigger grid update at most 2x per second
        $.delayedTask("zoomUpdate", 500, function() {
            // make sure change event for zoom gets triggered
            lsScreen.change();
        });
    });

    setupScreenDetection();
    lsScreen.trigger('initComplete');
});

/**
 * set up screen and zoom detection functionality
 */
function setupScreenDetection() {
    var sd = new ScreenDetection();
    sd.watchZoom(function(obj) {
        var oldZoomValue = lsScreen.get('browserZoom');
        lsScreen.set('browserZoom', obj.zoom);
        var z = Math.round(obj.zoom*100);
        if (obj.init) {
            _gaq.push(['_trackEvent', 'Zoom', 'Init', z]);
        } else {
            _gaq.push(['_trackEvent', 'Zoom', 'Change', z]);
        }
        if (oldZoomValue != obj.zoom) {
            // zoom value has changed
            LsLog.info('browser zoom changed from ' + oldZoomValue + ' to ' + obj.zoom);
        }
    });
    if (sd.canDetectZoom) {
        lsScreen.set('browserZoom', sd.zoom);
    } else {
        _gaq.push(['_trackEvent', 'Zoom', 'CannotDetect']);
    }
    // watch for screen changes
    var screenRes = lsScreen.get('res');
    sd.watchScreenRes(function(width, height, onInit) {
        if (onInit && screenRes[0] == width && screenRes[1] == height) {
            // screen resolution assumption is correct.
            if (!lsScreen.get('cal')) {
                // screen isn't calibrated, kick off calibration (after 1 sec delay)
                window.setTimeout(function() {
                    lifeSizeViewer.trigger('startCalibration');
                }, 1000);
            }
        } else {
            // screen resolution is different from expected (or previous) resolution!
            if (onInit) {
                _gaq.push(['_trackEvent', 'Screen', 'ResolutionChangeOnInit']);
            } else {
                _gaq.push(['_trackEvent', 'Screen', 'ResolutionChange']);
            }
            LsLog.info("new resolution = " + width + "x" + height + ", onInit = " + onInit);
            lsScreen.set('res', [width, height]);
            // fetch new screen data
            $.post('/view/screenres', {w: width, h: height}, function(data) {
                LsLog.debug("response from screenres:", data);
                //console.log('received response:');
                //console.dir(data);
                if (data.status == 'ok') {
                    // update the LsScreen object
                    lsScreen.set(data.screen);
                    lsScreen.set('matches', data.screenMatches);
                    lifeSizeViewer.trigger('screenChanged');
                    if (!lsScreen.get('cal')) {
                        // this screen isn't calibrated, so kick off calibration
                        lifeSizeViewer.trigger('startCalibration');
                    }
                }
            });
        }
    });
}


/**
 * sets up view of the LifeSizer image.
 */
function setUpImageDisplay() {

    lsScreen.on('change:zoom continuousZoom', function() {
        $('.lifesize').lifeSizeView(lsScreen.get('zoom'));
    });
    // for browserZoom change, we only need to recenter
    lsScreen.on('change:browserZoom', function() {
        $('.lifesize').centerInParent();
    });

    // TODO:render if ppi, zoom, or screen resolution is updated

    // render image on calibration complete
    lifeSizeViewer.on('calibrationComplete screenChanged', function() {
        // calibration has been completed, re-render image
        $('.lifesize').lifeSizeView(lsScreen.get('zoom'), true);
    });

    lifeSizeViewer.on('swapImage', function(lsImage) {
        // if there are more than 1 image in the viewer, remove all but one of them. (the one
        // remaining we'll fade out below).
        // This shouldn't happen but it does. I suspect the remove() after fadeout doesn't
        // always work
        $.each($('.lifesize'), function(c, img) { if (c!=0) $(img).remove(); });

        // TODO:don't swap if lsImage is current Image already
        var img = $('<img class="lifesize"/>');
        img.attr('src', lsImage.get('urls')['o']).attr('title', lsImage.get('name'));
        img.attr('width', lsImage.get('rw')).attr('height', lsImage.get('rh'));
        img.attr('data-ls-uid', lsImage.get('uid')).attr('data-ls-ref', lsImage.get('ref'));
        img.attr('style', 'display:none;position:absolute');
        $('#image-box').prepend(img);

        $('.lifesize:last').fadeOut(800, 'linear', function() {
            // after fadeout, remove altogether
            $(this).remove();
        });
        // set to 100% zoom, or maximum allowed if 100 isn't possible
        var newZoom = Math.min(lsImage.getZoomLimits()[1], 100);
        lsScreen.set('zoom', newZoom);
        img.centerInParent().draggable(); //lifeSizeView(newZoom, true).draggable();
        //img.draggable();

        $('.lifesize:first').fadeIn(800, 'linear');
        lifeSizeViewer.trigger('swapImageComplete');
    });
}

var JavascriptWindowDelegate = {
    initialize: function() {
        $(window).resize(function() {
            $.maxFrequencyTask('viewerResized', 1000, function() {
                lifeSizeViewer.trigger('viewerResized');
            });
        });
    },

    closeViewer: function() {
        //window.opener = ''; // not sure if this is necessary
        if (LsWindow.inPopup())
            window.close();
    },

    /**
     * resizes the window to given dimensions, though enforces a minimum size of 550x350
     * @param width requested width
     * @param height requested height
     * @param allowSmaller set to false if window should only be increased in size, never decreased
     * @return true if the window was resized, false if size of window already had requested size
     */
    resizeWindow: function(width, height, allowSmaller) {
        if (!LsWindow.inPopup())
            return;

        // NOTE: if these change they should probably also change in embed.js
        var minWidth = 600;
        var minHeight = 400;
        var newWidth = Math.max(minWidth, width);
        var newHeight = Math.max(minHeight, height);

        LsWindow.resizeTo(newWidth, newHeight, allowSmaller);
        return true;
    }
};
var LightboxWindowDelegate = {
    initialize: function() {
        // TODO:fire viewerResized event on #main if window size changed
    },

    closeViewer: function() {

    },
    resizeWindow: function(width, height) {

    }
};

(function($) {
    /**
     * sets the scale for all matching elements
     * @param scale the scale (100 = lifesize)
     */
    $.fn.lifeSizeView = function(zoomValue, centerInScreen) {
      // set the scale for all matching elements
      return this.each(function() {
        var img = $(this);
        var dims = lsImageDims(img);
        var browserZoom = lsScreen.get('browserZoom');

        var newWidth = Math.round(dims.width * zoomValue/100.0);
        var newHeight = Math.round(dims.height * zoomValue/100.0);


        var width = img.width();
        var height = img.height();
        var position = img.position();
        img.attr('height', newHeight);
        img.attr('width', newWidth);

        //console.log("user zoom: " + zoomValue + ", browser zoom: " + LsScreen.browserZoom +
        //    "dimensions: " + newWidth + 'x' + newHeight);
        if (centerInScreen) {
          img.centerInParent();
        } else {
          // zoom around current center point
          img.css('top',  position.top - (newHeight-height)/2);
          img.css('left', position.left - (newWidth-width)/2);
        }
      });
    };

    function lsImageDims(img) {
        var dims = null;
        $.each(LsImages.img, function(i, image) {
            if (img.data('ls-ref') == image.ref && img.data('ls-uid') == image.uid) {
                var f = lsScreen.get('ppi') / image.ppi;
                dims = { width: Math.round(image.w * f), height: Math.round(image.h * f)};
            }
        });
        return dims;
    }

    // centers any element in the center of it's parent element
    $.fn.centerInParent = function() {
        return this.each(function(){
            var obj = $(this);
            var height = obj.parent().height();
            var width = obj.parent().width();
            obj.css('top', height/2-obj.height()/2);
            obj.css('left', width/2-obj.width()/2);
        });
    };

    /**
     * registers key up/down listeners with the window, and also
     * registers mousewheel listener on current element
     * @param zoomFunc function to call on zoom, passes the delta, positive for zoom in, negative for zoom out
     */
    $.fn.listenControls = function(zoomFunc) {
      $(this[0]).keydown(function(event){
        // see here for details: http://unixpapa.com/js/key.html
        //console.log(event.keyCode);
        var handled = false;
        switch (event.keyCode) {
          case 37:
          case 40:
          case 63233:
          case 63234:
            zoomFunc(-1);
            handled = true;
            break;
          case 38:
          case 39:
          case 63232:
          case 63235:
            zoomFunc(1);
            handled = true;
            break;
          default:
            //console.log('received: ' + event.which);
        }
        return !handled;
      });
      function translateScrollDelta(delta, min, max) {
          var pol = (delta < 0) ? -1 : 1;
          delta = Math.abs(delta);
          // anything below min is ignored
          if (delta < min) {
              return 0;
          }
          if (delta > max) delta = max;
          var diff = max - min;
          // diff will be spread over 10 steps
          var tr = 9 * (delta - min)/(max - min) + 1;
          return Math.round(tr) * pol;
      }

      $(this[0]).mousewheel(function(event, delta) {
        // adjust delta so the value returned is comparable for all browsers
        // firefox returns 0.33, 0.66 etc whereas Chrome returns multiples of 1
        if (LsBrowserInfo.firefox) {
            delta = translateScrollDelta(delta, 0.33, 5);
        } else if (LsBrowserInfo.safari) {
            delta = translateScrollDelta(delta, 0.025, 5);
        }
        // chrome is fine as is
        zoomFunc(delta);
        return false;
      });
    };

})(jQuery);



/*
 * LifeSizeViewer object, used for dispatching and handling main calibration and window events
 *
 * startCalibration
 *
 * openCalibrationView
 *
 * calibrationCanceled
 *
 * calibrationComplete
 *
 * closeViewer
 *
 * recenter
 *
 * screenChanged
 *
 * viewerResized
 *
 * swapImage
 *
 * swapImageComplete
 *
 */
var LifeSizeViewer = Backbone.Model.extend({

    initialize: function() {
        var me = this;

        // TODO:set this dynamically based on implementation
        //var WindowDelegate = window.opener ? JavascriptWindowImpl : LightboxWindowImpl;
        var windowDelegate = JavascriptWindowDelegate;
        windowDelegate.initialize();

        this.on('closeViewer', function() {
            LsLog.info("closing viewer");
            windowDelegate.closeViewer();
        });


        function resizeWindow(allowSmaller, width, height) {
            // resize window on calibrationComplete, screenChanged or when specifically requested
            var reqWidth, reqHeight;
            if (typeof width === 'undefined' || typeof height === 'undefined') {
                // width and height weren't passed in, determine optimal dimensions first
                //TODO: this assumes there's only a single image in view.
                var img = $('.lifesize:first');
                LsLog.debug("image has dimensions: " + img.width() + "x" + img.height());
                // keep margin of 90 vertical and 40 horizontal pix
                reqWidth = img.width() + 40;
                reqHeight = img.height() + 90;
            } else {
                reqWidth = width;
                reqHeight = height;
            }
            LsLog.info("resizing window to " + reqWidth + "x" + reqHeight);
            windowDelegate.resizeWindow(reqWidth, reqHeight, allowSmaller);
        }

        // handle events that trigger change of window size
        this.on('resizeWindow calibrationComplete screenChanged', function(width, height) {
            resizeWindow(true, width, height);
        });
        // with swapImageComplete event, resize window but never make it smaller
        this.on('swapImageComplete', function(width, height) {
            resizeWindow(false, width, height);
        });

        // recenters lifesize image
        this.on("recenter viewerResized", function() {
            $('.lifesize').centerInParent();
        })
    }

});


var Toolbar = Backbone.Model.extend({
    // only allow zoom up to roughly 2x the actual resolution of the image
    MAX_ZOOM_FACTOR : 2,
    MIN_DISPLAY_SIZE : 0.5, // minimum display size in actual inches

    initialize: function() {
        var me = this;

        me.updateZoomLimits(); // determine min and max zoom first
        me.setupZoomControls();

        // fire event if close button clicked
        var f = true;
        $('#close-button').click(function() {
            lifeSizeViewer.trigger('closeViewer');
        });

        // initialize tooltips
        var tipDefaults = {
            className: 'tip-twitter',
            showTimeout: 0,
            alignTo: 'target',
            alignX: 'inner-left',
            offsetX: -7,
            offsetY: 8,
            slide: false,
            fade: true,
            showAniDuration: 0,
            hideAniDuration: 1000,
            showOn: 'hover',
            allowTipHover: true
        };

        // set up tooltip for calibrated view
        var opts = $.extend({ timeOnScreen: 7000, content:  function(updateTooltip) {
            var title;
            var name = lsScreen.get('name');
            if (name) {
                title = lsScreen.find_match_by_name(name);
            } else {
                var res = lsScreen.get('res');
                title = Math.round(lsScreen.diameter()) + '" display at ' + res[0] + "x" + res[1];
            }
            return '<div id="tt-calibrated"><span class="tt-title-cal">' + title + '</span><br/>Click if this is not correct</div>';
        } }, tipDefaults);
        $('#calibrated-icon').poshytip(opts);
        // set up tooltip for uncalibrated view
        var opts = $.extend({ timeOnScreen: 10000, content: function(updateTooltip) {
            return $('#uncalibrated-tt-wrapper').html();
        } }, tipDefaults);
        $('#uncalibrated-icon').poshytip(opts);

        // set up start calibration triggers
        $('#uncalibrated-icon,#calibrated-icon,#warning-message').click(function() {
            lifeSizeViewer.trigger('startCalibration');
        });
        // attach click handlers to tooltips
        $('.tip-twitter').on('click', '#tt-uncalibrated', function() {
            lifeSizeViewer.trigger('startCalibration');
        });
        $('.tip-twitter').on('click', '#tt-calibrated', function() {
            lifeSizeViewer.trigger('startCalibration');
        });

        // on calibration start, hide tooltips and measure dropdown
        lifeSizeViewer.on('startCalibration', function() {
            // remove warning bar and tooltips
            $('#warning-bar').hide();
            $('#uncalibrated-icon').poshytip('hide');
            $('#calibrated-icon').poshytip('hide');
            // hide settings dropdown
            measureTools.showMeasureBar(false);
        });
        // on calibration complete, update toolbar
        lifeSizeViewer.on('calibrationComplete', function() {
            LsLog.info("complete, ppi = " + lsScreen.get('ppi'));
            me.calibratedView(lsScreen.get('cal'));
            $('#calibrated-icon').poshytip('show');
        });
        // on calibration cancel, show warning bar after 1 sec
        lifeSizeViewer.on('calibrationCanceled', function() {
            if (!lsScreen.get('cal')) {
                window.setTimeout(function() {
                    $('#warning-bar').show();
                }, 1000);
            }
        });

        me.calibratedView(lsScreen.get('cal'));

        // handle screen resolution change
        lifeSizeViewer.on('screenChanged', function() {
            me.calibratedView(lsScreen.get('cal'));
            if (lsScreen.get('cal')) {
                // screen is calibrated - set to view in LifeSize and show calibration tooltip
                lsScreen.set('zoom', 100.0/lsScreen.get('browserZoom'));
                $('#calibrated-icon').poshytip('show');
            }
        });

        // update the max zoom and min zoom when appropriate
        lifeSizeViewer.on('calibrationComplete screenChanged swapImageComplete', function() {
            me.updateZoomLimits();
        });
    },

    /**
     * sets the upper and lower zoom limits to values appropriate for the current image resolution
     * and screen pixel density.
     */
    updateZoomLimits: function() {
        if (!LsImages.img || LsImages.img.length == 0) return;
        var primaryImg = LsImages.img[0];
        // do not allow zoom beyong MAX_ZOOM_FACTOR * actual resolution of image.
        var max = this.MAX_ZOOM_FACTOR * primaryImg.ppi / lsScreen.get('ppi');
        LsLog.debug("max zoom scale based on current image: " + (Math.round(max*100)));
        // round to nearest 50%, if max zoom > 100%
        this.maxScale = (max > 1) ? (Math.round(max*2) * 50) : (Math.round(max*100));

        //minimum scale is whatever size the image has when it can fit in the window completely
        var renWidth = primaryImg.w * lsScreen.get('ppi') / primaryImg.ppi;
        var renHeight = primaryImg.h * lsScreen.get('ppi') / primaryImg.ppi;
        // TODO: will $(window).width() and height work properly on other devices and if browser zoom != 100 ?
        var winWidth = $(window).width();
        var winHeight = $(window).height() - 45; // substract size of toolbar
        if (renWidth <= winWidth && renHeight <= winHeight) {
            // image fits in current window completely at 100% zoom. Set minimum zoom to 100
            this.minScale = 100;
            LsLog.debug('image fits in current window: min zoom = 100%');
        } else {
            // figure out if we should base the
            var wF = renWidth / winWidth;
            var wH = renHeight / winHeight;
            var adj = (wF > wH) ? wF : wH;
            LsLog.debug("min zoom scale based on current image: " + (Math.floor(10/adj)*10));
            // round down to nearest 10%, but no smaller than 10%
            this.minScale = Math.max(10, Math.floor(10/adj)*10);
        }
        if (this.minScale > this.maxScale) this.minScale = this.maxScale; // TODO: disable zoom in this case

        var sliderElem = $("#slider");
        sliderElem.slider({
            min: this.minScale,
            max: this.maxScale
        });
        // TODO:if minScale > 100 or maxScale < 100, need to notify that lifesize display isn't possible
    },

    calibratedView: function(calibrated) {
        if (calibrated) {
            // show zoom label and 1:1 button
            $('#zoomlabel-container').show();
            $('#lifesize-button-container').show();
            // update calibration image
            $('#uncalibrated-icon').poshytip('hide');
            $('#calibrated-icon').poshytip('hide'); // hide, as it may be displaying info from previous screen
            $('#uncalibrated-icon').hide();
            $('#calibrated-icon').show();
            $('#screen-diam-container').show();
            // set correct labels in tooltips and on toolbar
            $('.screen-diam').html(Math.round(lsScreen.diameter()));

        } else {
            // hide zoom label and 1:1 button
            $('#zoomlabel-container').hide();
            $('#lifesize-button-container').hide();
            // update calibration image
            $('#calibrated-icon').hide();
            $('#uncalibrated-icon').show();
            $('#screen-diam-container').hide();
            $('#uncalibrated-icon').poshytip('hide'); // don't show tooltip
        }
    },

    // set up slider
    setupZoomControls: function() {
        var me = this;
        var usingSlider = false;
        var sliderElem = $("#slider");

        sliderElem.slider({
            //min: me.minScale,  scale now set by updateZoomLimits
            //max: me.maxScale,
            value: (me.maxScale >= 100) ? 100: me.maxScale,
            slide: function(event, ui) {
                me.usingSlider = true;
                me.continuousZoom(ui.value);
            },
            stop: function(event, ui) {
                // set continuous value to false to indicate we're finished zooming
                me.usingSlider = false;
                lsScreen.set('zoom', ui.value);
            }
        });

        // 1:1 button click handler, sets zoom back to 100%
        $('#lifesize-button').click(function() {
            _gaq.push(['_trackEvent', 'LifeSizeTools', 'LifeSizeButtonClick', Math.round(lsScreen.get('zoom'))]);
            lsScreen.set('zoom', 100.0/lsScreen.get('browserZoom'));
            lifeSizeViewer.trigger('recenter');
        });

        // updates lifesize button state and zoom label
        lsScreen.on('change:zoom change:browserZoom continuousZoom initComplete', function(eventName) {
            // update button state
            var realZoom = Math.round(lsScreen.get('zoom') * lsScreen.get('browserZoom'));
            if (realZoom == 100) {
                $('#lifesize-button').removeClass('lifesize-off').addClass('lifesize-on');
            } else {
                $('#lifesize-button').removeClass('lifesize-on').addClass('lifesize-off');
            }
            // update zoom label
            $('#zoomlabel').html(realZoom);
            //$('#zoomlabel').html(lsScreen.get('zoom') + (100*lsScreen.get('browserZoom'))-100);
            // move slider in the correct position
            if (!me.usingSlider) { // only update slider position if zoom value isn't updated by slider itself
                sliderElem.slider( "option", "value", lsScreen.get('zoom'));
            }

            // current zoom is actually bigger than the maximum allowed zoom. Change zoom level
            if (lsScreen.get('zoom') > me.maxScale) {
                lsScreen.set('zoom', me.maxScale);
                LsLog.info("zoom set to " + lsScreen.get('zoom') + " which is greater than maximum allowed. Setting to " + me.maxScale);
            } else if (lsScreen.get('zoom') < me.minScale) {
                lsScreen.set('zoom', me.minScale);
                LsLog.info("zoom set to " + lsScreen.get('zoom') + " which is lower than minimum allowed. Setting to " + me.minScale);
            }
            // TODO: trigger warning messages if zoom can't be set to 100%
        });

        /*
        lsWindow.on('browserZoom', function(event, oldZoom, browserZoom, init) {
            if (!init) {
                //$('#zoomlabel').html(Math.round(LsScreen.zoom + (100*browserZoom)-100)); // update value in zoom label
                // calculate zoom difference. If >0, make bigger, otherwise smaller
                lsScreen.set('zoom', Math.round(LsScreen.zoom + (100 * (browserZoom - oldZoom))));
                $('#zoomlabel').html(lsScreen.get('zoom')); // update value in zoom label
                sliderElem.slider("option", "value", lsScreen.get('zoom'));
            } else if (init && browserZoom != 1.0) {
                // set the screen zoom to correct value
                lsScreen.set('zoom', Math.round(100 * browserZoom));
                lsWindow.triggerHandler('updateZoom', ['browserZoomInit', lsScreen.get('zoom'), false]);
            }
        });
        */
    },

    /**
     * silently updates the zoom property, but also fires the continuousZoom
     * event for those who are interested
     */
    continuousZoom: function(zoomValue) {
        if (zoomValue >= this.minScale && zoomValue <= this.maxScale) {
            lsScreen.set({zoom: zoomValue}, {silent:true});
            lsScreen.trigger('continuousZoom', zoomValue);
        }
    }
});

