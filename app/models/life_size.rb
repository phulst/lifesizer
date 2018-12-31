class LifeSize
  attr_accessor :screen_config

  # constructor. screen_config must contain three properties: :width, :height and :ppi
  def initialize(screen_config = nil)
    @screen_config = screen_config
  end

  # calculates the dimensions at which the image should be rendered to appear lifesize
  # This is returned in the format { height => y, width => x}
  # Pass in the image object to render
  def image_size(image)
    conv_factor = @screen_config[:ppi] / image.ppi
    w = (image.width * conv_factor).round
    h = (image.height * conv_factor).round
    { :width => w, :height => h }
  end

  # calculate the PPI of the screen with a calibration image, and
  # the width in pixels that image has on the screen when it's rendered lifesize.
  #
  # ppi of screen can be calculated with the properties of the reference(calibration)
  # image, and the actual width of how it was rendered true size on the screen, as follows:
  #
  #
  #                Width in pix of cal. image (Wi)     width in pix on screen (Ws)
  #  true size =   -------------------------------  =  ---------------------------
  #                PPI of cal. image  (PPIi)           PPI of screen (PPIs)
  #
  #
  #   so Wi/DPIi = Ws/PPIs and Wi * PPIs = Ws * PPIi
  #
  #   PPIs = PPIi * Ws / Wi
  #
  def calc_screen_ppi_with_calibration_image(cal_image_ppi, cal_image_width, ls_width)
   screen_ppi = (cal_image_ppi * ls_width).to_f / cal_image_width
   self.ppi = round(screen_ppi, 2)
  end


  # updates the ppi of the current screen configuration with a given screen diameter
  def calc_screen_ppi_with_diameter(diameter)
    # first calculate physical dimensions
    dim = calc_screen_dimensions(diameter)
    # ppi = width in pixels / width in inch
    self.ppi = round(width.to_f / dim[:width], 2)
  end

  # calculates the diameter of the current screen in inches (using pythagoras)
  #
  # diameter of screen =   sqrt(   (width in pix / dpi)**2  + (height in pix / dpi)**2  )
  def screen_diameter
    wi = width.to_f / ppi
    hi = height.to_f / ppi
    round(Math.sqrt(wi**2 + hi**2), 2)
  end

  # calculates the width and height of the screen in inches, with a given diameter and
  # the current screen resolution
  def calc_screen_dimensions(diameter)
    w_inch = Math.sqrt( (diameter**2 * width**2).to_f / (width**2 + height**2))
    h_inch = w_inch * height / width
    { :width => w_inch, :height => h_inch}
  end

  # calculates the lifesize image ppi (number of pixels that represents one true inch
  # in the image).
  #
  #               image width (in pixels) * screen dpi
  # image ppi =   ------------------------------------
  #                   image render width (in pixels)
  #
  def calc_image_ppi(img_width, img_render_width)
    (img_width * ppi / img_render_width).round
  end


  # calculates the image ppi based on an arrow drawn on the image
  #
  #               arrow len in pixels * width of image in pixels
  # image ppi =   ----------------------------------------------------
  #               arrow length in inches * width of image as rendered
  #
  def calc_image_ppi_with_arrow(arrow_pix, arrow_len, image_width, image_render_width)
    (arrow_pix * image_width) / (arrow_len * image_render_width)
  end

  
  def height
    @screen_config[:height]
  end
  def width
    @screen_config[:width]
  end
  def ppi
    @screen_config[:ppi]
  end
  def ppi=(val)
    @screen_config[:ppi] = val
  end

  # round a number to a given number of decimals
  def round(number, decimals)
    return number.round if decimals == 0
    fact = 10**decimals
    (number * fact).round.to_f / fact
  end
end
