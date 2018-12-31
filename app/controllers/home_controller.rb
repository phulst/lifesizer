#
# Home page controller
#
class HomeController < ApplicationController
  layout 'bolder'

  def index
    redirect_to images_featured_url
  end
end
