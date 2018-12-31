class ShowController < ApplicationController
  before_filter :set_mobile_formats    # check to see if we need to render iOS/android views
  before_filter :screen_config, :lifesize

  layout :select_layout, :except => 'error'

  # renders the lifesize show popup window contents
  def index
    handle_view
  end

  # handles the modal view
  def view_modal
    handle_view
  end

  # this ajax method is called immediately after calibration or immediately
  # after a screen resolution change is detected
  def render_info
    account, ref, app_key = params[:user], params[:ref], params[:a]
    if (account.nil? || ref.nil?)
      json_error("missing parameters")
      return
    elsif (@screen_res.nil?)
      json_error("unable to find current screen resolution");
      return
    end

    # look up the image
    begin
      @image = Image.find_user_image_by_ref(account, ref)
      #@image = Image.find_lifesize_image(account, ref)
    rescue ActiveRecord::RecordNotFound
      json_error("image not found: " + ref)
      return
    else
      if @image.nil?
        json_error("image not found: " + ref)
        return
      end

      # calculate how big the image should be rendered now, and return that to the server
      lifesize = LifeSize.new(@screen_config)
      sz = lifesize.image_size(@image)
      response = { :width => sz[:width], :height => sz[:height], :confidence => @screen_config[:confidence]}
      puts "image response will be #{response.to_json}"
      respond_to do |format|
        format.json { render :json => response }
      end
    end
  end

  # picks the appropriate layout. 'lifesize_popup unless for Mobile safari'
  def select_layout
    (ios_client? || nook?) ? false : "lifesize_popup"
  end

  # error page
  def error
  end


  private


  def handle_view
    user_id, ref, app_key  = params[:user], params[:ref], params[:a]
    height, width = params[:h], params[:w]
    if (user_id.nil? || ref.nil?)
      redirect_to_error("missing parameters")
      return
    end

    # look up the image
    begin
      @user_id = user_id
      @image_ref = ref
      @app_key = app_key
      @image = Image.find_user_image_by_ref(user_id, ref)
    rescue ActiveRecord::RecordNotFound
    end

    if !@image
      # try to create one
      handler = UnknownImageHandler.new
      @image = handler.attempt_create_image(user_id, app_key, ref)
    end

    if !@image
      # still don't have an image
      logger.error("unable to find image with id #{ref} and user id #{user_id}")
      flash[:error] = t('show.error.image_not_found')
    end

    @image_found = !@image.nil?
    theme
  end
end
