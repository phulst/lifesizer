class ImagesController < ApplicationController
  # authentication required for most actions in this controller
  before_filter :authenticate_user! , :except => [:featured, :recent, :show, :remote_save, :remote_get, :check_img]
  # authentication for jsonp request
  before_filter :json_auth_check_for_write, :only => [:remote_save, :remote_get]
  before_filter :json_auth_check_for_read,  :only => [:check_img]

  before_filter :screen_config, :only => [:index, :show, :edit, :featured, :recent, :add_image, :user, :create_complete]
  before_filter :lifesize, :only => [:index, :show, :edit, :featured, :recent, :user, :create_complete]

  VALIDATION_ERROR = 1

  # GET /images
  # GET /images.xml
  def index
    @images = Image.find_images

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @images }
    end
  end

  # returns the featured LifeSize images.
  def featured
    @images = Image.featured_images
  end

  # returns the 100 most recently added images.
  def recent
    page = params[:page].try(:to_i) || 1
    @images = Image.recent_images(page)
  end

  # fetches and displays all images submitted by the current user
  def user
    page = params[:page].try(:to_i) || 1
    @images = Image.user_images(current_user.id, page)
  end

  # GET /images/17838978a3ec983b18ff
  # GET /images/17838978a3ec983b18ff.xml
  def show
    @image = Image.find_by_guid(params[:id])

    return not_found if !@image

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @image }
    end
  end

  #
  # renders the new Image screen
  def new
    @image = Image.new

    @has_custom_bookmarklet = current_user.account_option.bookmarklet?
    if @has_custom_bookmarklet
      @api_key = ApiKey.find_write_key(current_user)
    end

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @image }
    end
  end

  # POST
  # receives the image upload or the remote image url
  def upload
    @image = Image.new(params[:image])

  end

  # GET /images/1/edit
  def edit
    @image = Image.editable_by(current_user).find_by_guid(params[:id])
    return not_found if !@image
  end

  #
  # handles the upload url form post
  def create
    valid = false
    begin
      par = params[:image].except(:remote_upload_url, :width, :height, :medium_height, :medium_width)
      @image = Image.new(par)
      @image.user = current_user
      @image.remote_upload_url = params[:image][:remote_upload_url]
      @image.original_url = @image.remote_upload_url if has_value(@image.remote_upload_url)
      @image.page_url = params[:image][:page_url] if !params[:image][:page_url].blank?
      @image.width = params[:image][:width] if @image.width.nil?
      @image.height = params[:image][:height] if @image.height.nil?
      @image.medium_width = params[:image][:medium_width] if @image.medium_width.nil?
      @image.medium_height = params[:image][:medium_height] if @image.medium_height.nil?
      # validate image
      valid = @image.valid?
    rescue CarrierWave::DownloadError
      @image.errors.add(:remote_upload_url, "^This url doesn't appear to be valid")
    rescue CarrierWave::IntegrityError
      @image.errors.add(:remote_upload_url, "^This url does not appear to point to a valid image")
    end

    # only validate, don't save yet
    if valid
      # calculate best render dimensions for image
      if params['browser_width'] && params['browser_height']
        max_width = params['browser_width'].to_i - 50
        max_height = params['browser_height'].to_i - 50
      else
        logger.warn("no browser_width or browser_height set")
        max_width = 800
        max_height = 600
      end

      render_dims = ScreenUtils.calculate_biggest_display_dimensions_possible(@image, max_width, max_height)
      @render_width, @render_height = render_dims[0], render_dims[1]

      logger.debug("rendering image of #{@image.width}x#{@image.height} at res #{@render_width}x#{@render_height}" +
        " to fit browser of dims #{max_width}x#{max_height}")

      @scale = 100
      render :action => :configure, :layout => "layouts/configure"
      # redirect_to(images_configure_path)
    else
      
      render :action => :new
    end
  end

  # parses the config data and completes the image creation
  
  def create_complete
    @image = Image.new(params[:image])
    @image.user = current_user

    # calculate the image dpi.
    length_in_inches = @image.length_in_inches
    @image.ppi = @lifesize.calc_image_ppi_with_arrow(params['arrow_length'].to_f, length_in_inches, @image.width, params['render_width'].to_i)
    @image.calibrate_data(params['arrow_start'], params['arrow_end'])
    @image.image_type = Image::TYPE_LS
    @image.source = 'site'

    if @image.save
      redirect_to(images_user_path)
    else
      render :action => :new
    end
  end

  #
  # renders page 2 of the image add flow
  def configure
  end


  # PUT /images/1
  # PUT /images/1.xml
  #
  # only the following properties can be updated:
  #   calibrate_length
  #   calibrate_unit
  #   calibrate_coords
  #   page_url
  #   original_url
  #   ref
  #   private
  #
  # image is identified by the auto_ref (like '_12')
  def update
    par = params

    @image = Image.editable_by(current_user).find_by_guid(params[:guid])

    # set these variables back to nil if they were in the request but blank
    if par[:ref]
      @image.ref = par[:ref].blank? ? nil : par[:ref]
    end
    if par[:name]
      @image.name = par[:name].blank? ? nil : par[:name]
    end
    if par[:page_url]
      @image.page_url = par[:page_url].blank? ? nil : par[:page_url]
    end
    @image.private = par[:private] if par[:private]

    if !par[:calibrateLength].blank?
      @image.calibrate_length = par[:calibrateLength].to_f
      @image.calibrate_unit   = par[:calibrateUnit].to_i if !par[:calibrateUnit].blank?
      @image.calibrate_coords = par[:calibrateCoords] if !par[:calibrateCoords].blank?
      @image.ppi = calculate_ppi(@image)
    end

    orig_url = par[:originalUrl]
    if !orig_url.blank? && orig_url != @image.original_url
      # url was updated
      @image.remote_upload_url = orig_url
      @image.original_url = orig_url
    end

    if @image.save
      render :json => @image.js_serialize
    else
      #TODO: handle error
      render :json => { :error => 500 }, :status => 500
    end
  end

  # PUT /images/1
  # PUT /images/1.xml
  def updateold
    puts "UPDATING IMAGE"
    img = params[:image]

    @image = Image.find_user_image(current_user.id, params[:id]).first

    if @image.original_url != img[:original_url]
      #image url has changed
      puts "IMAGE URL has changed!"
      begin
        @image.remote_upload_url = img[:original_url]
      rescue => err
        #TODO: url could not be fetched, return error
      end
    end

    # only allow the following attributes to be updated, and set any blank values to nil
    attr = img.select { |k, v| [:original_url, :name, :page_url, :ref, :private].include?(k.to_sym)}
    update_attr = {}
    attr.each_pair { |k,v| update_attr[k] = v.blank? ? nil : v }

    respond_to do |format|
      if @image.update_attributes(update_attr)
        format.html { redirect_to(@image, :notice => 'Image was successfully updated.') }
        format.xml  { head :ok }
        format.js { render :json => { :response => 'success'} }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @image.errors, :status => :unprocessable_entity }
        format.js { render :nothing => true }
      end
    end
  end

  # DELETE /images/1
  # DELETE /images/1.xml
  def destroy
    @image = Image.editable_by(current_user).find_by_guid(params[:id])
    return not_found if !@image
    @image.destroy

    respond_to do |format|
      format.html { redirect_to(images_user_path) }
      format.xml  { head :ok }
    end
  end

  # main add image page
  def add_image
     @image = Image.new
     @ppi = @screen_config[:ppi]
  end

  # receives the image url, then goes out to fetch that url and returns the image thumbnail
  # url and other data
  def add_step_1
     image_url = params[:input_image_url]
     begin
       raise "no image url" if params[:input_image_url].empty?
       data = ImageTool.fetch_and_make_temp_thumbnail(image_url)
       data[:success] = true
     rescue => err
       data = { :success => false }
       logger.error("unable to fetch image or create thumbnail: #{err}")
     end
     render :json => data
  end

  # finishes the image add steps - receives all data required to create and save the lifesize image
  def add_finish
    if !current_user
      redirect_to_error("you are not logged in. Please log in first")
      return
    end

    @image = Image.new(params[:image])
    @image.ref = nil if @image.ref.nil? || @image.ref.empty?
    @image.name = nil if @image.name.nil? || @image.name.empty?
    @image.description = nil if @image.description.nil? || @image.description.empty?

    # create a lifesize instance, needed to calculate DPI
    lifesize = LifeSize.new(screen_config)

    # calculate the image dpi.
    cd = ActiveSupport::JSON.decode(params[:configure_data])
    length_inches = cd['unit'] == 'cm' ? (cd['physLength']/2.54) : cd['physLength']
    @image.ppi = lifesize.calc_image_ppi_with_arrow(cd['pixLength'], length_inches, @image.width, cd['renderWidth'])
    @image.calibrate_data=cd
    @image.user = current_user
    @image.image_type = Image::TYPE_LS

    logger.info("PPI of new image is: #{@image.ppi}")
    finish = (params['finish'] == 'true')

    #save the image
    resp = { :success => false }
    #begin
      if @image.save
         # move the temporary thumbnail url to it's permanent location
         ImageTool.save_thumbnail(params[:thumbnail_url], @image)
         resp[:success] = true
         resp[:redirect_to] = finish ? images_user_path : url_for(:action => :add_image)
      end
     #rescue => err
     #  logger.error(err)
     #end
     # set errors in response
     if (!resp[:success])
       if @image.errors.count > 0
         errors = []
         @image.errors.each{ |attr,msg| errors << [attr, msg] }
         resp[:errors] = errors
         resp[:errorType] = VALIDATION_ERROR
         resp[:errorMsg] = "There was a slight problem with the info you entered. Please correct the indicated fields."
       else
         resp[:errorMsg] = "A database error occurred, please try again later."
         resp[:errorType] = DATABASE_ERROR
       end
     end
     render :json => resp
  end

  # verifies that incoming json request has a valid user and access key
  # this requires a 'key' parameter to have been set
  #
  def json_auth_check_for_write
    k = params[:key]
    if k
      key = ApiKey.check_valid_key_for_write(params[:key])
      @user = key.user if key
    end
    if !key
      resp = { :error => { :msg => 'authentication error', :status => 401 }}
      # it would be appropriate to add :status => :unauthorized here, but the error callback handlers
      # in jquery won't work properly. So even though this is an authentication error, return status 200.
      render :json => resp, :callback => params[:callback]
      false
    end
    true
  end

  # verifies that incoming json request has a valid user and access key
  # this requires a 'key' parameter to have been set
  #
  def json_auth_check_for_read
    k = params[:key]
    if k
      key = ApiKey.check_valid_key_for_read(params[:key])
      @user = key.user if key
    end
    if !key
      resp = { :error => { :msg => 'authentication error', :status => 401 }}
      # it would be appropriate to add :status => :unauthorized here, but the error callback handlers
      # in jquery won't work properly. So even though this is an authentication error, return status 200.
      render :json => resp, :callback => params[:callback]
      false
    end
    true
  end


  # JSONP method used by plugins and external services to create or update image config.
  # accepts parameters:
  # name  - short name/title of image
  # image_url - the image url
  # ref - image reference
  # page_url - the page url to associate with image
  # source - source identifier (like 'cust_bookmarklet')
  #
  # Calibration data can be set with one of two methods:
  #
  # 1) by setting a ppi input parameter
  #
  # 2) by setting calibration data obtained with the arrow method. This would require
  # the following parameters:
  #
  # input_length  - length that arrow represents, ie '1.5'
  # unit - input unit (in/cm/mm)
  # arrow_length  - lengh of arrow in pixels
  # render_width  - pixel width at which image was rendered during calibration
  # arrow_start   - coordinates of arrow start point
  # arrow_end     - coordinates of arrow end point
  #
  # this action also uses the jsonp_auth_check_for_write filter, which requires a
  # key parameter to be passed in.
  #
  def remote_save
    image_url, name, ref, page_url, input_length, source = params[:image_url], params[:name], params[:ref], params[:page_url], params[:input_length], params[:source]

    # validate input.
    val_err = nil
    if !input_length.blank? && !positive_numeric?(input_length)
      # input length is set but has weird value
      val_err = 'input_length not valid'
    elsif !uri?(image_url)
      # image url must always be specified
      val_err = "image_url is not a valid URL"
    end
    # todo:add other validations

    if val_err
      resp = { :error => { :msg => val_err, :status => 400 }}
      # it would be appropriate to add :status => 400, but the error callback handlers
      # in jquery won't work properly. So even though this is an authentication error, return status 200.
      render :json => resp, :callback => params[:callback]
      return
    end


    @image = nil
    if !ref.blank?
      # see if we can find the image by reference. If ref is set it must match that
      @image = Image.find_user_image_by_ref(@user.id, ref)
    else
      # see if we can find it by url
      @image = Image.find_lifesize_image_by_url(@user.id, image_url)
    end

    @update = false
    if !@image
      # couldn't find image by ref or url, create a new one
      @image = Image.new do |i|
        i.remote_upload_url = image_url
        i.original_url = image_url
        i.ref = ref if has_value(ref)
        i.name = name if has_value(name)
        i.image_type = Image::TYPE_LS
        i.page_url = page_url if !page_url.blank?
        i.source = source if !source.blank?
        i.user = @user
      end
    else
      #updating existing image
      @update = true
      if @image.original_url != image_url
        #image url has changed
        @image.remote_upload_url = image_url
        @image.original_url = image_url
      end
      @image.page_url = page_url if has_value(page_url)
      @image.name = name if has_value(name)
    end

    # if calibration data is present, update the ppi
    if params[:input_length] && params[:arrow_length] && params[:render_width]
      @image.input_length = params[:input_length]
      @image.unit = params[:unit] if params[:unit] # set unit (defaults to inches)

      length_in_inches = @image.length_in_inches
      @image.ppi = LifeSize.new.calc_image_ppi_with_arrow(params[:arrow_length].to_f, length_in_inches, @image.width, params[:render_width].to_i)
      @image.calibrate_data(params[:arrow_start], params[:arrow_end])
    elsif params[:ppi]
      # ppi is specified directly
      @image.ppi = params[:ppi]
      # reset all of the other stuff
      @image.calibrate_coords = nil
      @image.calibrate_unit = nil
      @image.calibrate_length = nil
    end

    # save or update the image
    begin
      @image.save!
    rescue StandardError
      resp = { :error => { :msg => 'unable to save image', :status => 500 }}
      # it would be appropriate to add :status => :unauthorized here, but the error callback handlers
      # in jquery won't work properly. So even though this is an authentication error, return status 200.
      render :json => resp, :callback => params[:callback]
    else
      data = { 'url' => @image.url, 'ref' => @image.image_ref }
      data['ppi'] = @image.ppi if @image.ppi
      data['page_url'] = @image.page_url if @image.page_url
      render :json => data, :callback => params[:callback]
    end
  end

  # returns an image by reference, used by remote clients with CORS/JSONP
  # accepts parameters:
  # ref  - single reference or comma separated list of references
  # cal - set to 't' (true) if calibration data should be included in response (default: false)
  # returns: json array of image data
  def remote_get
    # multiple refs may be provided
    refs = params[:ref]
    if !refs.blank?
      refs = [refs] if refs.is_a?(String)
      images = []
      refs.each do |ref|
        # TODO: optimize this to fetch all images in a single query
        image = Image.find_user_image_by_ref(@user.id, ref)
        if image
          img = {
              :original_url   => image.original_url,
              :ref            => image.image_ref,
              :width          => image.width,
              :height         => image.height,
              :ppi            => image.ppi,
              :name           => image.name,
              :page_url       => image.page_url,
              :description    => image.description }
          if (params[:cal] == 't') # with Calibration Data
            img.merge!({
              :unit           => image.unit,
              :arrow_start    => image.arrow_start,
              :arrow_end      => image.arrow_end,
              :input_length   => image.input_length
            })
          end
          images << img
        end
      end
      resp = (images.length > 0) ? images : error_response("no matches", 404)
      render :json => resp, :callback => params[:callback]
    else
      render :json => error_response('bad request', 400), :callback => params[:callback]
    end
  end

  # This is used by the embed script to load the cache of all user images asynchronously
  # Returns a comma separated list of image refs
  # This action can also be accessed through route /lsc/<key>.js
  def check_img
    arr = []
    # todo: only load the image refs, no need to load entire image object for each row
    images = Image.recent_user_images(@user.id)
    arr = images.collect { |img| img.image_ref }

    # return array in a hash, we may need to add other properties later
    render :json => {:refs => arr}, :callback => params[:callback]
  end

  # returns true if the value passed in is a positive number, otherwise false
  def positive_numeric?(object)
    begin
      f = Float(object)
      f && f > 0
    rescue
      false
    end
  end

  def uri?(string)
    uri = URI.parse(string)
    %w( http https ).include?(uri.scheme)
  rescue URI::BadURIError
    false
  rescue URI::InvalidURIError
    false
  end

  private

  def error_response(msg, status)
    { :error => { :msg => msg, :status => status }}
  end

  def has_value(v)
    v && v.length > 0
  end

  # calculates the ppi based on the request input parameters. If some/all are missing,
  # use the actual ppi parameter passed in. (prefer to calculate it server side)
  def calculate_ppi(img)
    ppi = 0
    if params[:arrowPixelLength] && params[:renderWidth] && params[:calibrateLength] && params[:calibrateUnit]
      ppi = @lifesize.calc_image_ppi_with_arrow(params[:arrowPixelLength].to_f, img.length_in_inches, img.width, params[:renderWidth].to_i)
    else
      ppi = params[:ppi]
    end
    logger.info "server calculated ppi: #{ppi}, ppi from client: #{params[:ppi]}"
    ppi
  end
end
