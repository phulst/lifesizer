/**
 * test file for bookmarklet plugin dev.
 */
(function(){

	var lifesizer = {
        minPixels : 10000,

        /**
         * accepts an image object, and returns the pixel dimensions as 2 element array [width, height]
         */
        getDimensions: function(img) {
            if (img.naturalWidth) {
                return [img.naturalWidth, img.naturalHeight];
            } else {
                // TODO: if image is rendered at different dimensions than the actual image dimensions,
                // and naturalWidth/naturalHeight properties aren't supported, this will return the
                // incorrect dimensions
                return [img.width, img.height];
            }
        },

        /**
         *
         * @param imgData
         * @param imgArr
         * @return true if image was added to imgArr, otherwise false
         */
        addImage: function(imgData, imgArr) {
            // keep the imgArr sorted by highest resolution image first
            var needToAdd = true;
            var added = false;
            for (var j=0;j<imgArr.length;j++) {
                if (imgData.src == imgArr[j].src) {
                    // already have this image in the array. If this one has a higher resolution,
                    // replace the original (it may be the same image rendered at multiple dimensions on the page)
                    console.log("already found img " + imgData.src + ", first " + imgArr[j].width +"x" + imgArr[j].height +
                        " now " + imgData.width + "x" + imgData.height);
                    if (imgData.pix > imgArr[j].pix) {
                        console.log('replacing');
                        imgArr.splice(j, 1, imgData);
                    }
                    needToAdd = false;
                    break;
                } else if (imgData.pix > imgArr[j].pix) {
                    imgArr.splice(j, 0, imgData);
                    added = true;
                    needToAdd = false;
                    break;
                }
            }
            if (needToAdd) {
                // imgData hadn't been added yet.
                imgArr.push(imgData);
                added = true;
            }
            return added;
        },

		/**
		 * returns array of hashes for all images in the current page that are of high enough
		 * resolution. Each element in the array has properties: 
		 *   width   : image width
		 *   height  : image height
		 *   pix     : total pixels (width x height)
		 *   src     : source url
		 * This array is sorted by decreasing total number of pixels. 
		 */
		getImages: function() {
			var images = document.images;
			var imgArr = [];
			for (var i=0;i<images.length;i++) {
				var img = images[i];
				if (img.parentNode.tagName.toLowerCase()=='a') {
                    // img is wrapped in a link, which may be to a larger resolution version of the image
                    var linkImgData = this.tryFetchImage(img.parentNode);
                    if (linkImgData) {
                        this.addImage(linkImgData, imgArr);
                    }
				}

                var dims = this.getDimensions(img);
                var imgWidth = dims[0];
                var imgHeight = dims[1];
				// accept everything that has a minimum of 50k pixels, but reject anything
				// that's long and very narrow (most likely banners)
                var ratio = imgHeight / imgWidth;
				var totalPix = imgWidth * imgHeight;
				if ((totalPix >= this.minPixels) && (ratio >= 0.25 && ratio <= 4)) {
					var imgData = { pix: totalPix, width: imgWidth, height: imgHeight, src: img.src };
                    if (this.addImage(imgData, imgArr)) {
                        // add border around image
                        img.style.border='inset red 2px';
                    }
				}
			}
			return imgArr;
		},

        displayInOverlay: function(images) {
            var div = document.createElement("div");
            div.className = "lifeSizerOverlay";
            div.style.backgroundColor = '#0011ff';
            div.style.position = 'absolute';
            div.style.top = '10px'
            div.style.bottom = '10px';
            div.style.left = '10px';
            div.style.right = '10px';
            document.body.appendChild(div);
        },

        loadDependencies: function() {

        }
	};

	var images = lifesizer.getImages();
	if (images.length > 0) {
        lifesizer.loadDependencies();

        lifesizer.displayInOverlay(images);
        alert(window.jQuery.version);
	  console.dir(images);	
	} else {
		alert('no images found that were large enough for LifeSizer');
	}
})();
