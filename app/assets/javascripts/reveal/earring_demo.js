window.earringDemo = function(){
    var productImage = new Image();
    var c=document.getElementById("myCanvas");
    var ctx=c.getContext("2d");
    var productSize;
    var sizes = [20, 28, 14];


    var imgData = {
        // coordinates of earlobe of model
        bgConnPoint : [622,768],
        // coordinates of top center of earring that should connect to earlobe
        prodConnPoint : [159,64]
    };

    // private methods
    var fitInBox = function(img, maxDim) {
        var width = img[0]; var height = img[1];
        var maxWidth = maxDim[0]; var maxHeight = maxDim[1];
        if (width <= maxWidth && height <= maxHeight) {
          return img; // no need to resize
        } else if (width > maxWidth && height > maxHeight) {
          // both width and height are too large
          var f1 = width / maxWidth;
          var f2 = height / maxHeight;
          var f = (f1 > f2) ? f1 : f2;
        } else if (width > maxWidth) {
          var f = width / maxWidth; // only width is too large
        } else {
          var f = height / maxHeight; // height is too large
        }
        return [Math.round(width/f), Math.round(height/f)];
    };

    // returns coordinates of where product image should be rendered relative to the canvas
    var productImgOffset = function(i) {
        // first, calculate the canvas coordinates of the img connection point given the background render size
        var trueBgConnPoint = [(i.bgRenderDims[0] * i.bgConnPoint[0] / i.bgOrigDims[0]) + i.bgImgOffset[0],
                               (i.bgRenderDims[1] * i.bgConnPoint[1] / i.bgOrigDims[1]) + i.bgImgOffset[1]];
        // now calculate the trueProdConnPoint relative to the top left corner of the prod image on the canvas
        var trueProdConnPoint = [i.prodRenderDims[0] * i.prodConnPoint[0] / i.prodOrigDims[0],
                                 i.prodRenderDims[1] * i.prodConnPoint[1] / i.prodOrigDims[1]];
        // now we can calculate the canvas coordinates that the product image should have
        var prodCanvasOffset = [trueBgConnPoint[0] - trueProdConnPoint[0],
                                trueBgConnPoint[1] - trueProdConnPoint[1]];
        return prodCanvasOffset;
    };

    var displayProductImage = function() {
        ctx.clearRect(0, 0, c.width, c.height);
        var boxDim = imgData.bgRenderDims[1] * productSize / 100;
        var dim = fitInBox([productImage.width, productImage.height], [boxDim, boxDim]);
        imgData.prodOrigDims = [productImage.width, productImage.height];
        imgData.prodRenderDims = [dim[0],dim[1]];
        var offset = productImgOffset(imgData);
        ctx.drawImage(productImage,offset[0],offset[1],dim[0],dim[1]);
    };


    // setup code
    Reveal.addEventListener( 'fragmentshown', function( event ) {
        if (event.fragment.id == 'size-too-big') {
            earringDemo.transitionTo(sizes[1]);
        } else if (event.fragment.id == 'size-too-small') {
            earringDemo.transitionTo(sizes[2]);
        }
    });
    Reveal.addEventListener( 'fragmenthidden', function( event ) {
        if (event.fragment.id == 'size-too-big') {
            earringDemo.transitionTo(sizes[0]);
        } else if (event.fragment.id == 'size-too-small') {
            earringDemo.transitionTo(sizes[1]);
        }
    } );

    return {

        // public methods
        init : function() {
            productSize = sizes[0];
            var img = document.getElementById('modelImg');
            img.src="/assets/presentations/earring_model.jpg";
            img.addEventListener('load', function() {
                var dim = fitInBox([this.width, this.height], [c.width, c.height])
                //imgData.bgOrigDims   = [this.naturalWidth, this.naturalHeight];
                imgData.bgOrigDims   = [339,1200];
                imgData.bgRenderDims = [dim[0], dim[1]];
                imgData.bgImgOffset = [c.width-dim[0],0];
                productImage.src = '/assets/presentations/chandelier_earrings.png';
                productImage.addEventListener('load', displayProductImage);
            });
        },

        transitionTo : function(toSize, callback) {
            var timer = setInterval(function() {
                var increment = (toSize > productSize);
                productSize = productSize + (increment ? 0.3 : -0.3);
                if ((increment && productSize < toSize) || (!increment && productSize > toSize)) {
                    displayProductImage();
                } else {
                    clearInterval(timer);
                    if (typeof(callback) == 'function') {
                        callback();
                    }
                }
            }, 30);
        }
    }
}();