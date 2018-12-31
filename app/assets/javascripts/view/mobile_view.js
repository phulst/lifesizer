
var iOS = (/(iPad|iPhone|iPod)/i).test(navigator.userAgent);
var iphone = (/iPhone/).test(navigator.userAgent);


function centerImage() {
    var ls = $('.lifesize');
    var height = ls.height();
    var docHeight = $(document).height();
    if (height < docHeight) {
        ls.css('margin-top', ((docHeight - height)/2) + "px");
    } else {
        ls.css('margin-top', 0);
    }
}

$(function() {
    //$('.lifesize').centerInParent();
    centerImage();

    $('#close-button').click(function() {
        // close ourselves
        window.opener = 'x';
        window.self.close();
    });

    // hide the alert if close message is clicked
    $('#hide-alert').click(function() {
        $('#alert-msg').hide();
    });

    // remove device message after 10 seconds
    setTimeout(function() {
        $('#device-msg').fadeOut('slow');
    }, 10000);

    var myScroll = new iScroll('content', { hScrollbar: false, vScrollbar: false, lockDirection: true });

    $(window).bind('orientationchange', function (e) {
        setTimeout(function () {
            myScroll.refresh();
            centerImage();
        }, 0);
    });

    //setTimeout(function() {
    //    $.mobile.changePage($('#device-select'));
    //}, 2000);
});
