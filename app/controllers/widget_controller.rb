class WidgetController < ApplicationController
  layout false
  #before_filter :screen_config, :lifesize

  # renders the LifeSize iframe widget. This should typically not be called locally, as the
  # html that this action returns should be cached on CloudFiles
  def index
  end

  # temporary action for instructions in popup view
  def popup
    user, ref, app_key = params[:user], params[:ref]
    @image = Image.find_user_image_by_ref(user, ref)
  end
end