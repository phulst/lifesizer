#
# various utility methods for screen calculates
#
class ScreenUtils

  # calculates the biggest dimensions at which an image can be displayed at acceptable
  # resolution and without exceeding the specified max dimensions.
  # Acceptable resolution is considered half the original resolution or over
  def self.calculate_biggest_display_dimensions_possible(image, max_width, max_height)
    mf = 2 # max zoom factor
    w,h = image.width, image.height
    if mf*w >= max_width && mf*h >= max_height
      # we can increase (or reduce) size to max dimensions
      dims = fit_to_box(w, h, max_width, max_height)
    elsif mf*w >= max_width
      # restrict to width
      dims = [max_width, h * max_width.to_f / w]
    elsif mf*h >= max_height
      # restrict to height
      dims = [w * max_height.to_f / h, max_height]
    else
      # fit to maximum enlargement factor (which will be smaller
      # than the max container dimensions)
      dims = [mf*w, mf*h]
    end
    [dims[0].round, dims[1].round]
  end

  # Fits an image with given dimensions (w,h) to a box with given dimensions.
  # This may either enlarge the image or make it smaller, but it will
  # calculate the closest possible fit that doesn't exceed either the
  # box dimensions.
  def self.fit_to_box(w, h, max_w, max_h, allow_enlarge = true)
    if (w < max_w && h < max_h && !allow_enlarge)
      # image already fits in box and enlargement not allowed
      return [w, h]
    end

    out_w, out_h = max_w, max_h
    if (max_w / max_h.to_f) < (w / h.to_f)
      # constrain by width
      out_h = max_w * h.to_f / w
    else
      # constrain by height
      out_w = max_h * w.to_f / h
    end
    [out_w, out_h]
  end


end