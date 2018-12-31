/**
 * moves everything in 'guessed state' (if passed in true) to indicate
 * that display is not in lifesize
 */
function sizeGuessed(guessed) {
    if (guessed) {
        $('#qmLeft').css({top: "10px", left: "10px"}).fadeIn(3000);
        $('#qmRight').css({bottom: "10px", right: "10px"}).fadeIn(3000);
        $('#showLifesize').hide();
        $('#scaleTxt').hide();
    } else {
        $('#qmLeft').fadeOut(1000);
        $('#qmRight').fadeOut(1000);
        $('#showLifesize').show();
        $('#scaleTxt').show();
    }
}

/**
 * returns the value of the given url parameter
 * @param name url parameter name
 */
function urlParam(name){
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results) {
        return 0;
    }
    return results[1] || 0;
}

/**
 * sets the new screen ppi and updates all controls for this new ppi
 * @param ppi
 */
function updateScreen(p, lsw, lsh) {
    ppi = p;
    var scale = $('.lifesize').getScale();
    $('#ruler').rulergrid('updateSize', ppi, scale);
    $('.lifesize').lifeSizeUpdate(lsw, lsh);
}

/**
 * displays the dialog with screen suggestions. Called on first loading popup.
 */
function showScreenSuggestionsDialog() {

    function chooseOption(ok,m,f) {
        if (ok) {
            var name = f['opt_screen'];
            _gaq.push(['_trackEvent', 'Calibrate', 'ScreenType', name]);
            if (name == 'other') {
                openCalibration();
            } else {
                // save screen ppi to server
                //var data = "name=" + name + "&ref=" + imageRef + "&user=" + userId;
                var data = { name: name, ref: imageRef, user: userId };
                $.post('/calibrate/save_known', data, function(data) {
                    if (data.status == 'ok') {
                        updateScreen(data.ppi, data.lsw, data.lsh);
                    }
                    sizeGuessed(false);
                });
            }
        } else {
            _gaq.push(['_trackEvent', 'Calibrate', 'NotNowForSuggestions']);
        }
    }
    $.prompt(suggestionDialogContent, { buttons: { Continue: true, "Not Now": false }, show: 'slideDown', callback: chooseOption });
}

/**
 * opens the calibration screen or, if the size can be guessed, brings up the
 * screen selection dialog first.
 */
function startCalibration() {
    if (hasScreenSuggestions) {
        showScreenSuggestionsDialog();
    } else {
        openCalibration();
    }
}

/**
 * displays calibration screen. Resizes the window to 1000x800 as well, unless less available space
 */
function openCalibration() {
    _gaq.push(['_trackEvent', 'Calibrate', 'Start']);
    var width  = Math.min(1000, screen.availWidth);
    var height = Math.min(800, screen.availHeight);
    window.resizeTo(width, height);
    location.href=calUrl;
}

/**
 * handler for screen selection dialog buttons
 */

/**
 * handle zoom in/out events. Positive delta = zoom in, negative = zoom out
 */
function doZoom(delta) {
    // delta appears to be in increments of 0.33, so multiply by 3 to get int steps
    var steps = Math.round(delta * 3);
    var scale = $('.lifesize').getScale();
    var newScale = scale + steps;
    if (newScale < MIN_SCALE) newScale = MIN_SCALE; // keep scale within bounds
    if (newScale > MAX_SCALE) newScale = MAX_SCALE;
    //console.log("zooming " + (delta>0?"in ":"out ") + steps + " steps, scale = " + newScale);
    updateScale(newScale);
    $("#slider").slider( "option", "value", newScale);
    $.delayedTask("updateRuler", 500, function() {
        $('#ruler').rulergrid('update', ppi, newScale);
    });
}

/**
 * triggered if zoom scale gets updated through various means
 * @param scale new scale
 * @param center, optional, set to true if image should be centered in popup
 */
function updateScale(newScale, center) {
    var ls = $('.lifesize');
    var scale = ls.getScale();
    if (newScale != scale) {
        ls.scale(newScale, center);
        $('#scale').html(newScale);
    }
}


function resizeWindowIfNotBigEnough() {
    var ls = $('.lifesize');
    var widthNeeded = ls.width() + 60;
    var heightNeeded = ls.height() + 150;

    var dims = $.calculateBestWindowDim([ls.width(), ls.height()], [700, 500]);
    var newWidth = dims[0];
    var newHeight = dims[1];

    var bs = $.browserSize();
    if (newWidth != bs.w || newHeight != bs.h) {
        // at least one dimension needs to change
        //var bs = $.browserSize();
        //var msg = "current window: " + window.width + "x" + window.height + ", bs = " + bs.w +"x" +bs.h +
        //    ", resizing window to " + newWidth + "x" + newHeight;
        //alert(msg);

        //if (console) console.log("current window: " + window.width + "x" + window.height +
        //    ", resizing window to " + newWidth + "x" + newHeight);

        // TODO: only add 50pix on FF, chrome doesn't need this. 
        window.resizeTo(newWidth, newHeight+50);
    }
}

/**
 * initializes rulers and sets up click handlers on ruler/grid buttons
 */
function initRulers() {
    var r = $('#ruler');
    r.rulergrid('init', ppi);
    $('#rulerButton').button().click(function() {
        _gaq.push(['_trackEvent', 'LifeSizeTools', 'ToggleRuler']);
        r.rulergrid('toggleRulers');
    });
    $('#gridButton').button().click(function() {
        _gaq.push(['_trackEvent', 'LifeSizeTools', 'ToggleGrid']);
        r.rulergrid('toggleGrid');
    });
    // canvas isn't draggable but the lifesize image underneath is.
    // pass mouse event to that element
    r.mousedown(function(event) {
        $('.lifesize').trigger(event);
    });
}

// executed on page load complete
$(function() {
    // track current screen resolution
    screenRes.pollScreen();

    MIN_SCALE = 10;
    MAX_SCALE = 400;

    // initialize as lifesize image
    $('.lifesize').lifesizeInit();

    // make the lifesize image draggable
    $('.lifesize').draggable();

    // recenter the image if window is resized
    $(window).resize(function() {
        $('.lifesize').centerInParent();

        $.delayedTask("updateRulerOnWindowResize", 500, function() {
            var scale = $('.lifesize').getScale();
            $('#ruler').rulergrid('updateSize', ppi, scale);
        });
    });

    // display the correct dialog for calibration
    if (imageFound && urlParam('back') != 't') { // do not display any dialogs if user came back, or if no image found
        if (hasScreenSuggestions) {
            // show known options for this display
            showScreenSuggestionsDialog();
        } else if (guessedConfig) {
            // show the generic 'you need to calibrate' dialog
            $.prompt(suggestionDialogContent, { buttons: { Continue: true, "Not Now": false }, show: 'slideDown', callback: function(ok,m,f){
                if (ok) {
                    // user hit 'Continue'
                    openCalibration();
                } else {
                    // not now
                    _gaq.push(['_trackEvent', 'Calibrate', 'NotNow']);
                    sizeGuessed(guessedConfig);
                }
            } });
        }
    }

    initRulers();

    // resize the window if it's not big enough
    // TODO:only call this if this page is called from an external site
    resizeWindowIfNotBigEnough();

    // set up click handlers to start calibration
    $('#calibrate').button().click(function() {
        _gaq.push(['_trackEvent', 'LifeSizeTools', 'CalibrateButtonClick']);
        startCalibration();
    });
    $('.notlifesize').click(function() {
        _gaq.push(['_trackEvent', 'LifeSizeTools', 'CalibrateIconClick']);
        startCalibration();
    });

    // reset to lifesize on button click
    $('#showLifesize').button().click(function() {
        _gaq.push(['_trackEvent', 'LifeSizeTools', 'LifeSizeButtonClick']);
        updateScale(100, true);

        $("#slider").slider( "option", "value", 100 );
        $('.lifesize').lifesize();
        $('#ruler').rulergrid('update', ppi, 100);
    });

    // set up slider
    $("#slider").slider({
        min: MIN_SCALE,
        max: MAX_SCALE,
        value: 100,
        slide: function(event, ui) {
            updateScale(ui.value);
        },
        // only update the ruler/grid on slide stop, not on every change event
        stop:function(event, ui) {
            $('#ruler').rulergrid('update', ppi, ui.value);
        }
    });

    // set defaults for tooltip view
    $.fn.qtip.defaults = $.extend(true, {}, $.fn.qtip.defaults, {
        style: {
            classes: 'ui-tooltip-rounded ui-tooltip-shadow'
        }
    });

    $('#qmLeft').qtip({
        id: 'tt0',
        position: {
            my: "left center",
            at: "center right"
        },
        content: {
            text: notLifeSizeTooltip
        }
    });
    $('#qmRight').qtip({
        id: 'tt1',
        position: {
            my: "right center",
            at: "center left"
        },
        content: {
            text: notLifeSizeTooltip
        }
    });

    // register and handle key and mousewheel events to control image zoom
    $(document).listenControls(doZoom);
});
