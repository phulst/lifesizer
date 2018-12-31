class ViewController < ApplicationController
  include MobileDetection
  before_filter :mobile_detect, :only => :index

  before_filter :screen_config, :lifesize

  layout :select_layout, :except => ['error']

  # renders the lifesize show popup window contents
  # As of now, both popup and modal actions render the same thing
  def index
    @user_id, ref, @app_key, prod = params[:user], params[:ref], params[:a], params[:p]
    # go metric for Trend-uk or if m=1 is set in url
    @metric = (params[:m] == '1' || @user_id == '1619')

    height, width = params[:h], params[:w]
    if (@user_id.nil? || ref.nil?)
      redirect_to_error("missing parameters")
      return nil
    end

    @images = []
    if prod
      # product was specified. Look up images by product instead of by reference
      i = UserProduct.find_images(@user_id, prod)
      @images = i ? Array.new(i) : [] # copy array to be safe, we are going to manipulate this array
      # now make sure the first image ref is the first one in the list of images returned.
      first_ref = ref.split(',')[0]
      @images.each do |img|
        if img.ref == first_ref
          @images.delete(img)
          @images.insert(0, img)
          break
        end
      end
    end
    if @images.length == 0
      # no product was specified, or the product lookup was not successful, look up images by reference
      ref.split(',').each do |r|
        img = Image.find_user_image_by_ref(@user_id, r)
        @images << img if img

        # use the UnknownImageHandler to create the image if possible.
        if img.nil?
          handler = UnknownImageHandler.new if !handler
          img = handler.attempt_create_image(@user_id, @app_key, ref)
          @images << img if img
        end
      end
    end

    if @images.empty?
      # still don't have an image
      logger.error("unable to find image with user id #{@user_id}, id #{ref} and product #{prod}")
      flash[:error] = t('show.error.image_not_found')
    else
      @images[0].view_url = "http://#{params[:img]}" if params[:img]
    end

    @images_found = !@images.empty?
    theme
  end

  def product_images
    Image.find_by_product
  end

  # GET /fview/17838978a3ec983b18ff/name-of-product
  # GET /fview/17838978a3ec983b18ff.xml
  def fullview
    @image = Image.find_by_guid(params[:guid])

    return not_found if !@image

    respond_to do |format|
      format.html # fullview.html.erb
      format.xml  { render :xml => @image }
    end
  end

  # ajax call that is made if a change of screen resolution is detected
  def screenres
    render 'screen', :content_type => 'application/json'
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
      respond_to do |format|
        format.json { render :json => response }
      end
    end
  end

  # picks the appropriate layout. 'modal unless for iOS/Android views'
  def select_layout
    return 'main_layout' if action_name == 'fullview'

    is_mobile_or_tablet?  ? false : "view_popup"
  end

  # error page
  def error
  end

  private

end
