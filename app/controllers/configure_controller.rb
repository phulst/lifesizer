#
# Configure controller
# Handles calibration of LifeSize images
#
class ConfigureController < ApplicationController
  layout 'lifesize_popup'

  def index
    @image_url, @height, @width = params[:imageUrl], params[:height].to_i, params[:width].to_i
    @render_width, @render_height = params[:renderWidth].to_i, params[:renderHeight].to_i
    @scale = (@render_width.to_f * 100 / @width).round

    puts "scale = #{@scale}"
    config = screen_config
    @dpi = config[:dpi]
  end
end
