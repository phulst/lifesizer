class DemoController < ApplicationController
  before_filter :screen_config, :only => :image
  before_filter :lifesize, :only => :image

  # simply shows an image for demo purposes
  def image
    @image = Image.find_user_image_by_ref(params[:user], params[:ref])
  end
end
