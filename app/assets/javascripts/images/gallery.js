$(function(){
    var container = $('#container');
    container.imagesLoaded(function(){
        container.masonry({
            // options
            itemSelector : '.ls_item',
            columnWidth : 220,
            isFitWidth : true
        });
        setupInfiniteScroll();
    });
});

function setupInfiniteScroll() {
    var container = $('#container');
    container.infinitescroll({
        navSelector  : '#page-nav',    // selector for the paged navigation
        nextSelector : '#page-nav a',  // selector for the NEXT link (to page 2)
        itemSelector : '.ls_item',     // selector for all items you'll retrieve
        bufferPx     : 500,
        loading: {
            finishedMsg: "<em>You've reached the end</em>",
            img: 'http://i.imgur.com/6RMhx.gif',
            msgText: "<em>Loading more images...</em>",
            speed: 'slow'
          }
    },
        // trigger Masonry as a callback
        function( newElements ) {
            // hide new items while they are loading
            var newElems = $( newElements ).css({ opacity: 0 });
            // ensure that images load before adding to masonry layout
            newElems.imagesLoaded(function(){
                // show elems now they're ready
                newElems.animate({ opacity: 1 });
                container.masonry( 'appended', newElems, false );
                $(newElems).lifesizer();
            });
        }
    );
}

function showEmbed(user_id, image_ref) {
    var url = '/widget/popup';
    var params = { user: user_id, ref: image_ref };
    popup(url, params, 600, 500);
}

/**
 * opens popup for lifesizer window
 * @param url url to load in window (should not contain query string)
 * @param params query parameters to add to url
 * @param width - minimum width of popup dialog (may be null or undefined)
 * @param height - minimum height of popup dialog (may be null or undefined)
 */
function popup(url, params, width, height) {
  // add parameters to url
  url += '?';
  for (var p in params) {
      url += p + "=" + params[p] + '&';
  }
  url = url.substring(0, url.length-1);

  // set up attributes for popup window
  var params = 'width='+width+', height='+height;
  //params += ', top='+top+', left='+left;
  params += ', directories=no';
  params += ', location=no';
  params += ', menubar=no';
  params += ', resizable=yes';
  params += ', scrollbars=no';
  params += ', status=no';
  params += ', toolbar=no';
  var newwin=window.open(url,'lifesize', params);
  if (window.focus) newwin.focus();
  return false;
}


lifesizer();