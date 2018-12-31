
$(function(){
    // enable lifesize view on thumbnail
    lifesizer();

    var configureView;
    function setUpEditImage(lsImage) {
        // open calibration popup on button click
        $('#calibrate_button').bind('click', function() {
            configureView = new ConfigureView({ model: lsImage, dialogType: 'minimal' });
            configureView.open();
            return false;
        });
    }

    var lsImage = new ImageModel(lsImageData);
    lsImage.set('host', 'http://' + location.host);
    lsImage.on('okToSave', function() {
        // persist to server
        lsImage.save({}, { success: function() {
            LsLog.info("image saved", lsImage.attributes);
        }});
        configureView.close();
    });

    // hide save button if image has never been calibrated
    //if (!lsImage.get('calibrateLength')) {
    //    $('#save_button').hide();
    //}

    // display form validation errors
    function handleValidationErrors(errors) {
        $('#error_explanation').show();
        for (var err in errors) {
            console.log(err + " = ");
            var msg = errors[err];
            var elem = $('.err_' + err);
            elem.empty();
            for (var i=0; i<msg.length; i++) {
                elem.append(msg[i] + "<br/>").show();
            }
        }
    }

    // handle response from Save button
    $('.edit_image').bind('ajax:success', function(evt, data) {
        if (data.error && data.messages) {
            handleValidationErrors(data.messages);
            return;
        }

        // hide all previous errors
        $('.error_label').hide();
        $('#error_explanation').hide();
        if (data.nextImage) {
            window.location = '/images/' + data.nextImage + '/edit';
        } else {
            window.location = '/images/user'; // redirect request
        }
    });

    setUpEditImage(lsImage);

    // 1. image dpi too low
    // 2. image very large dpi too low
    // 3. image very large

    //1
    // The image resolution appears to be too low to show this image in actual size on most screens.
    // Please verify that the length you entered is correct and/or try again with a higher resolution image.

    //2
    // The image resolution appears to be too low to show this image in actual size on most screens.
    // With the length you specified, this image would also be too large to fit on on most computer
    // screens.
    // Please verify that the length you entered is correct and/or try again with a higher resolution image.

    //3
    // Based on your input, the actual dimensions of this image (including borders/backgrounds) appears to be
    // 100 inches. It would require a very large screen to be able to see this item in lifesize. Users with
    // common computer screens may only be able to see a fraction of this image without scrolling around or
    // zooming out. Are you sure you want to continue adding this image?



    // If the arrow you just drew represents 10 inches, that would make the total actual size of your image
    // (including background) 3ft 6 inches. This is too large for many screen such as those on laptops
    // or tablets. Users of such devices will have to scroll around to view this entire image.
    // Are you sure you want to continue adding this image?
});
