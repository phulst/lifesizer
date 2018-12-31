$(function(){

    var host = 'http://' + document.location.host;
    var appKey = '6d44dc5f715851f6';

    // display image dimensions dynamically
    $('.lifesizer-image').load(function() {
        var i = $(this);
        // display the original image dimensions in the search results
        var dims = i.parents('.ls_item').find('.image-dims');
        var width = this.naturalWidth ? this.naturalWidth : this.width;
        var height = this.naturalHeight ? this.naturalHeight : this.height;
        dims.html(width + "x" + height);

        //console.log("image loaded: " + i.attr('src') + " with dimensions " + width + "x" + height);
    });

    var lsImage;
    $('.calibrate_link').click(function(event) {
        var imgItem = $(this).parents('.ls_item');
        var name       = imgItem.find('p.product-name').text();
        var productUrl = imgItem.find('p.seller a').attr('href');
        var imgUrl     = imgItem.find('.lifesizer-image').attr('src');
        var ref        = imgItem.find('.lifesizer-image').attr('data-ls-ref');
        var imgDims    = imgItem.find('.image-dims').text();
        var width, height;
        if (m = imgDims.match(/(\d+)x(\d+)/)) {
            width = parseInt(m[1]);
            height = parseInt(m[2]);
        }

        // create the image model
        lsImage = new ImageModel({ ref: ref, userId: lsUser, host: host });
        // check if the image already exists
        lsImage.fetchByRef({success: function(model, response){
            if (!response.error) {
                // image data received
                finishSetup(lsImage);
            }
        }, error: function(model, response) {
            //TODO this assumes that a 404 was received. Handle other error types
            LsLog.debug("unknown product");
            lsImage.set({
                name:           name,
                pageUrl:        productUrl,
                url:            imgUrl,
                width:          width,
                height:         height,
                source:         'google'
            });
            finishSetup(lsImage);
        }});

        // attaches listeners and completes setup after image has been created or received from server
        function finishSetup(lsImage) {
            var configureView;
            lsImage.on('okToSave', function() {
                lsImage.save({key: appKey}, { success: function() {
                    // callback after completion
                    // reinitialize lifesizer if set on page
                    if (window.Ls) {
                        Ls.addRef(lsImage.get('ref'));
                        Ls.init();
                    }
                }});
                configureView.close();
            });
            configureView = new ConfigureView({ model: lsImage, dialogType: 'full' });
            configureView.open();
        }
        event.stopPropagation();
    });
});
