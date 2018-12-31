/**
 * This script is used in the calibrate/begin action
 */
var cfg = {
    onedollar:    { width: 1600,  height: 699, ppi: 258.8, name: '1dollar.jpg',    thumbWidth: 170, thumbHeight: 74,  scale: 100, kc: false},
    cd:           { width: 988,   height: 996, ppi: 197.6, name: 'cd.jpg',         thumbWidth: 170, thumbHeight: 171, scale: 100, kc: true},
    creditcard:   { width: 850,   height: 536, ppi: 247.2, name: 'cc.jpg',         thumbWidth: 170, thumbHeight: 107, scale: 100, kc: false},
    ruler:        { width: 1500,  height: 140, ppi: 123.0, name: 'ruler_full.jpg', thumbWidth: 170, thumbHeight: 16,  scale: 100, kc: false}
};

var _gaq = _gaq || []; // if not defined yet

// id of current image selected. In step one, set to false
var current = false;

var minScale = 10;
var maxScale = 500;

/**
 * calculates position data for image with specified ID, indicating
 * where the image should be displayed, based on current screen size and ppi
 * Returned object contains properties
 * top, left, width and height
 * @param imageId
 * @return hash containing width, height, top and left properties
 */
function calculatePositionData(imageId) {
    var c = cfg[imageId];
    var w = lsDim(c.width, c);
    var h = lsDim(c.height, c);
    var l, t;
    if (c.kc) {
        l = Math.round(($(document).width() - w) / 2);
        t = Math.round(($(document).height() - h) / 2);
    } else {
        // if not keeping centered, use absolute value
        l = 50;
        t = 150;
    }
    return { width: w, height: h, top: t, left: l };
}

/**
 * calculates size at which to render image
 * @param val dimension (height or width)
 * @param c the configuration (one of the values in cfg hash)
 * @param scale scale at which to render, 100 if not specified
 * @return render dimension
 */
function lsDim(val, c, scale) {
    scale = scale || 100;
    return Math.round((val * ppi * scale) / (c.ppi * 100));
}

/**
 * starts step 2 (the resizing step)
 * @param obj jquery object for lifesize image
 */
function stepTwo(obj) {
    // change text
    $('.stepOne').slideUp('fast', function(){
        $('#step2_'+current).slideDown('fast');
    });
    // enable finished button. show() doesn't work here, we need to use visibility property instead
    // otherwise jquery ui won't set the proper styles on the button
    $('#doneButton').css('visibility', 'visible');
    $('#slider').show();

    // make the image draggable if it's not centered
    obj.draggable({ disabled: cfg[current].kc });
}

/**
 * starts (goes back to) step one
 */
function stepOne() {
    $('.stepOne').show();
    $('#slider').hide();
    $('#doneButton').css('visibility', 'hidden');
    $('.stepTwoText').hide();
    // hide any full res images
    $('#lifesize').fadeTo('slow', 0.0).hide();
    $('#imageselections').fadeTo('slow', 1.0);
    current = false;
}

/**
 * handles click on the 'back' button
 */
function goBack() {
    if (current) {
        _gaq.push(['_trackEvent', 'Calibrate', 'BackToSelectMethod']);
        // we were in step two
        stepOne();
    } else {
        _gaq.push(['_trackEvent', 'Calibrate', 'CancelCalibration']);
        location.href=backUrl;
    }
}

/**
 * click handler for finished button. Submits the calibration info
 * back to the server
 */
function finished() {
    _gaq.push(['_trackEvent', 'Calibrate', 'Complete', current]);
    var c = cfg[current];
    $("#calForm #formImg").val(current);
    $("#calForm #formWc").val(c.width);
    $("#calForm #formWs").val($("#lifesize").width());
    $("#calForm #formP").val(c.ppi);
    $('#calForm').submit();
}

/**
 * determines which calibration image was selected, then does the animated zoom in
 * and switches the view to step 2.
 * @param elem DOM element for image that was selected
 */
function selectCalibrationImage(elem) {
    // immediately hide the text box
    $(elem).children('.calTitle').hide();
    
    // get the position of the currently selected image
    var em = $(elem);
    var img = em.find('img');
    var offset = img.offset();
    //alert('offset = ' + offset.top + ", " + offset.left);

    // hide the grid of images
    $('#imageselections').hide();

    var lsImage = $('#lifesize');
    current = false;
    var id = img.attr('id');
    if (id == 'onedollar' || id == 'cd' || id == 'creditcard' || id == 'ruler') {
        var c = cfg[id];
        lsImage.attr('src', '/images/cal/ref/' + c.name);
        lsImage.width (c.thumbWidth);
        lsImage.height(c.thumbHeight);
        current = id;
    }

    if (current) {
      _gaq.push(['_trackEvent', 'Calibrate', 'SelectMethod', current]); // track the calibration method
      // show the image at the original position
      lsImage.show().css('top', offset.top).css('left', offset.left).css('opacity', 1.0);
      var posData = calculatePositionData(id);
      // now animate it to final position and size

      lsImage.animate({
          width:  posData.width + 'px',
          height: posData.height + 'px',
          top:    posData.top + 'px',
          left:   posData.left + 'px'
      }, 800, function() {stepTwo(lsImage); });
    }
}

/**
 * event handler for zoom event (either through mousewheel or cursor keys
 * @param delta positive or negative number for zoom delta
 */
function doZoom(delta) {
    if (current) {
        var c = cfg[current];
        var newScale = c.scale + delta;
        $("#slider").slider( "option", "value", newScale );
        updateScale(newScale);
    }
}

function updateScale(scale) {
    var ls = $('#lifesize');
    if (current) { // && ls.is(":visible") ?
        var c = cfg[current];
        c.scale = scale;
        c.scale = (c.scale < minScale) ? minScale : c.scale;
        newWidth  = lsDim(c.width,  c, c.scale);
        newHeight = lsDim(c.height, c, c.scale);
        //console.log("setting to " +newWidth + "," +newHeight, ": scale: ", c.scale);
        ls.width(newWidth);
        ls.height(newHeight);
        if (c.kc) {
            centerLsImage();
        }
    }
}

/**
 * centers the lifesize image in the window
 */
function centerLsImage() {
    var posData = calculatePositionData(current);
    var ls = $("#lifesize");
    var top = ($(document).height() - ls.height()) / 2;
    var left = ($(document).width() - ls.width()) / 2;
    $("#lifesize").css('top', top + "px");
    $("#lifesize").css('left', left + "px");
}

/**
 * initialization code run on load complete
 */
$(function() {
    // track current screen resolution
    screenRes.pollScreen();

    // set the opacity of the thumbs to fade down to 75% when the page loads
    $(".calibrate").find('img').fadeTo("fast", 0.75); 

    // configure effects on hover of image
    $('.calibrate').hover(function() {
        $(this).css('border', '2px solid').css('border-color', '#404040');
        $(this).find('.calTitle').show();
        $(this).find('img').fadeTo("fast", 1.0); // This should set the opacity to 100% on hover
    }, function() {
        $(this).css('border', '2px solid').css('border-color', '#808080');
        $(this).find('.calTitle').hide();
        $(this).find('img').fadeTo("fast", 0.75); // This should set the opacity back to 60% on mouseout
    });

    $(".calibrate").click(function() {
        selectCalibrationImage(this);
    });

    // set up slider
    $("#slider").slider({
        min: 10,
        max: 400,
        value: 100,
        slide: function(event, ui) {
            updateScale(ui.value);
        }
    }).hide();

    // set up button click handlers
    $("#backButton").button().click(goBack);
    $("#doneButton").button().click(finished);

    // set up zoom controls for lifesize image
    $(document).listenControls(doZoom);

    // recenter the image if window is resized
    $(window).resize(function() {
        if (current && cfg[current].kc) {
            centerLsImage();
        }
    });
});
