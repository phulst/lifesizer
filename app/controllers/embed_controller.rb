class EmbedController < ApplicationController
  before_filter :authenticate_user!, :only => [:instructions]
  before_filter :screen_config, :only => [:instructions]
  before_filter :lifesize, :only => [:instructions]

  def index
  end

  def howto

  end


  def app_key
  end

  def instructions
    @app_key = (ApiKey.find_read_key(current_user) || ApiKey.generate(current_user, nil)).key

    images = Image.recent_user_images(current_user.id, 1)
    if images && images.length > 0
      @image = images[0]
      @app_key_for_image = @app_key
    else
      # HACK: use iphone test image from grant@lifesizer.com account
      @image = Image.find_user_image_by_ref(9, '_4')
      @app_key_for_image = @image.user.api_keys.first.key
    end
  end
end
