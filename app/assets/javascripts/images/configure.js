
MIN_SCALE = 10;
MAX_SCALE = 400;

// fired on cursor or mousewheel up
function doZoom(delta) {
  $('#imageContainer').drawArrow('clear'); // remove any visible arrow

  // delta appears to be in increments of 0.33, so multiply by 3 to get int steps
  var steps = Math.round(delta * 3);
  var scale = $('.lifesize').getScale();
  var newScale = scale + steps;
  if (newScale < MIN_SCALE) newScale = MIN_SCALE; // keep scale within bounds
  if (newScale > MAX_SCALE) newScale = MAX_SCALE;
  updateScale(newScale);
  $("#slider").slider( "option", "value", newScale);
}

// triggered if zoom scale gets updated through various means
function updateScale(newScale) {
  ls = $('.lifesize');
  var scale = ls.getScale();
  if (newScale != scale) {
    ls.scale(newScale);
    $('#finishButton').button("option", "disabled", true);
  }
}

/**
 * calculates the actual x and y positions in the actual image that would
 * correspond to an arrow start or end position as drawn
 * @param position start or end position of arrow (relative to imageBox parent container)
 * @return x and y coordinates (from left top) in actual lifesize image that this
 * arrow position would correspond with
 */
function calcPositionInImage(position) {
  var img = $('#mainLifeSizeImg');
  var top  = position.y * img.originalHeight() / img.height();
  var left = position.x * img.originalWidth()  / img.width();
  return { y: Math.round(top), x: Math.round(left) };
}

function arrowStart(start) {
  // reset arrow length
  noArrow();
}

function noArrow() {
  $('#arrow_length').val(0);
}

/**
 * this handler is called upon arrow draw complete
 * @param start start coordinate of arrow (relative to imageBox)
 * @param end end coordinate of arrow
 * @param length length of arrow in screen pixels
 */
function arrowComplete(start, end, length) {
  var imgArrowStart = calcPositionInImage(start);
  var imgArrowEnd = calcPositionInImage(end);
  //if (window.console) console.log("arrow drawn from " + imgArrowStart.x + "," + imgArrowStart.y + " to " +
  //    imgArrowEnd.x + "," + imgArrowEnd.y + " on original.");

  $('#arrow_start').val(imgArrowStart.x + "," + imgArrowStart.y);
  $('#arrow_end').val(imgArrowEnd.x + "," + imgArrowEnd.y);
  $('#arrow_length').val(length);

  //console.dir(selectionData);

  // display prompt length dialog
  $.prompt($('#sizePrompt').html(), {
    top: '10%',
    show: 'slideDown',
    buttons: { Ok: true, Cancel: false },
    submit: function(ok,m,f) {
      // pre-submit handler, used to validate length input
      var flag = true;
      if (ok) {
        var size = f.arrowSize.replace(',', '.');
        var length = parseFloat(size);
        if (!length || length <= 0) {
          m.find('#arrowSize').addClass('error');
          flag = false;
        } else {
          m.find('#arrowSize').removeClass('error');
        }
      }
      return flag;
    },
    callback: function(ok,m,f){
      if (ok) {
        $('#image_input_length').val(parseFloat(f.arrowSize));
        $('#image_unit').val(f.unit);
        $('#render_width').val($('#mainLifeSizeImg').width());
        $('#render_height').val($('#mainLifeSizeImg').height());

        $('#sizeLabel').html(f.arrowSize + " " + f.unit);
        $('#arrMsg').drawArrow('showMidLabel');
        $('#arrMsg').show();
        $('#finishButton').button("option", "disabled", false);
      } else {
        // action cancelled
        $('#imageContainer').drawArrow('clear');
        noArrow();
        $('#finishButton').button("option", "disabled", true);
      }
    }
  });
}

$(function() {
  // initialize as lifesize image
  $('.lifesize').lifesizeInit();

  // recenter the image if window is resized
  $(window).resize(function() {
    $('.lifesize').centerInParent();
  });

  // display tip dialog
  $.prompt($('#initMsg').html());

  // register and handle key and mousewheel events to control image zoom
  $(document).listenControls(doZoom);

  // set up for arrow draw
  $('#imageContainer').drawArrow({lineWidth: 4, color: '#84a800', straightAngleColor: '#a4c820', midElement: $('#arrMsg')});
  // set up for mouse draw
  $('#imageContainer').drawArrow('mouseDraw', arrowComplete, arrowStart);

  // set up slider
  $("#slider").slider({
    min: MIN_SCALE,
    max: MAX_SCALE,
    value: 100,
    slide: function(event, ui) {
      $('#imageContainer').drawArrow('clear');
      updateScale(ui.value);
    }
  });

    // set up click handler for finish button, and initially set to disabled
    $('#finishButton').button({disabled:true}).click(function(){
        if ($('#arrow_length').val() > 0) {
            $('.lsform').submit();
        }
    });

    $('#backButton').button().click(function() {
        parent.history.back();
    });
});
