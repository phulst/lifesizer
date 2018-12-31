
/**
 * returns the inner dimensions of the browser screen
 */
function innerDims() {
    var winW, winH;
    if (document.body && document.body.offsetWidth) {
        winW = document.body.offsetWidth;
        winH = document.body.offsetHeight;
    }
    if (document.compatMode == 'CSS1Compat' &&
        document.documentElement &&
        document.documentElement.offsetWidth ) {
        winW = document.documentElement.offsetWidth;
        winH = document.documentElement.offsetHeight;
    }
    if (window.innerWidth && window.innerHeight) {
        winW = window.innerWidth;
        winH = window.innerHeight;
    }
    return [winW, winH];
}

/**
 * document ready handler
 */
$(function() {
    var submitButton = $('#image_submit');
    // init submit button, and disable submit button on submit
    submitButton.button().click(function() {
        $('#spinner').show();
        $('form.lsform').submit();
        submitButton.button("option", "disabled", true);
        return false;
    });

    // set defaults for tooltip view
    $.fn.qtip.defaults = $.extend(true, {}, $.fn.qtip.defaults, {
        position: {
            my: "left bottom",
            at: "center right"
        },
        style: {
            classes: 'ui-tooltip-rounded ui-tooltip-shadow'
        }
    });

    $('.suggest_tooltip').qtip({
        id: 'tt0',
        content: {
            text: "The best images to use for LifeSizer are images of small-ish objects; things that are roughly the size of your computer screen or smaller. <br/>For most accurate results, use photos that are taken from a straight angle, either directly from the front/back/top/etc. "
        }
    });
    $('.ref_tooltip').qtip({
        id: 'tt1',
        content: {
            text: "You only need to enter something here if you want to embed this image in your website and you want to associate it directly to a specific item or product on your site. In that case, enter the unique ID that you keep for this product or image, such as the product SKU. You can do this later too."
        }
    });
    $('.title_tooltip').qtip({
        id: 'tt2',
        content: {
            text: "Enter a title to be displayed with your image"
        }
    });
    $('.page_url_tooltip').qtip({
        id: 'tt3',
        content: {
            text: "Enter the page URL for your product (this will be used to link back to your site)"
        }
    });

    // finally, set the inner dimensions of browser in the form
    var dims = innerDims();
    $('input[name=browser_width]').val(dims[0]);
    $('input[name=browser_height]').val(dims[1]);

});

// re-enable submit button so that when user returns (using back button) in FF,
// the button will be enabled again. onload event doesn't appear to fire in this case.
jQuery(window).bind("unload", function() {
    $('#image_submit').button("option", "disabled", false);
    $('#spinner').hide();
});
