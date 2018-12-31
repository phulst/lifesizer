//Copyright 2011 LifeSizer, Inc. All rights reserved.

/**
 * initialize widget
 */
$(function(){
    // center lifesize image
    var img = $('img.lsview');
    var top = ($(document).height() - img.attr('height') - 20)  / 2;
    var left = ($(document).width() - img.attr('width') - 20)  / 2;
    img.css("top", top).css("left", left);

    // set up overlay and click handler
    if ($('#ls_item').size() == 1) {
        $('#content').hover(showOverlay, hideOverlay);
        lifesizer({ outerClickSelector: '#content'});
    }
});

/**
 * shows the link overlay
*/
function showOverlay() {
    if ($.browser.msie) {
        $('#overlay').show(); // fadeIn of transparent object doesnt' work properly in IE
    } else {
        $('#overlay').fadeIn(300);
    }
}

/**
 * hides the link overlay
 */
function hideOverlay() {
    if ($.browser.msie) {
        $('#overlay').hide();
    } else {
        $('#overlay').fadeOut(300);
    }
}
