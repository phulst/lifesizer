class ImageRestController < ApiBaseController
  wrap_parameters include: [:ppi]

  skip_before_filter  :verify_authenticity_token
  before_filter :json_auth_check_for_write, :only => [:create, :update]
  before_filter :json_auth_check_for_read, :only => 'product_images'
  before_filter :lifesize, :only => [:create, :update]
  before_filter :cors_preflight_check
  after_filter :cors_set_access_control_headers


  # GET /user/22/images/3333
  # looks up and returns image either by reference of by guid.
  # if guid is 0, it will look up the image by reference (which should then
  # be provided as parameter)
  def show
    user_id, id, ref = params[:user_id], params[:id], params[:ref]
    img = nil
    if id == '0' && ref
      # do lookup by reference
      img = Image.find_user_image_by_ref(user_id, params[:ref])
    elsif id != '0'
      # do lookup by guid
      img = Image.find_user_image_by_guid(user_id, id)
    end
    return not_found if !img

    respond_to do |format|
      format.json { render :json => img.js_serialize, :callback => params[:callback] }
    end
  end


  # POST /images/1
  # POST /images/1.xml
  def create
    par = img_properties
    logger.info("parameters: #{par.inspect}")
    valid = true

    begin
      url = par[:original_url] || par[:url]

      @image = Image.new do |i|
        #specify all properties to copy explicitly
        i.user              = @user
        # set optional parameters
        i.name              = par[:name] if !par[:name].blank?
        i.ref               = par[:ref] if !par[:ref].blank?
        i.original_url      = url if url
        i.page_url          = par[:page_url] if !par[:page_url].blank?
        i.source            = par[:source] if !par[:source].blank?
        i.image_type = Image::TYPE_LS
      end

      # this may fail
      @image.remote_upload_url = url

      # set calibration data if specified
      if !par[:calibrate_length].blank?
        @image.calibrate_length = par[:calibrate_length].to_f
        @image.calibrate_unit   = par[:calibrate_unit].to_i if !par[:calibrate_unit].blank?
        @image.calibrate_coords = par[:calibrate_coords] if !par[:calibrate_coords].blank?
        @image.ppi = calculate_ppi(@image)
      end

    rescue CarrierWave::DownloadError
      @image.errors.add(:remote_upload_url, "^This url doesn't appear to be valid")
      valid = false
    rescue CarrierWave::IntegrityError
      @image.errors.add(:remote_upload_url, "^This url does not appear to point to a valid image")
      valid = false
    rescue StandardError
      @image.errors.add(:remote_upload_url, "There does not appear to be an image at this url")
      valid = false
    end

    if valid && @image.save
      # update product if set
      @image.user_product = par[:product] if par[:product]

      render :json => @image.js_serialize, :callback => params[:callback]
    else
      render :json => { :error => 403, :messages => prepare_errors(@image), :callback => params[:callback]}, :status => 200
    end
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
  #   name
  #   ref
  #   private
  #
  # image is identified by the auto_ref (like '_12')
  def update
    par = img_properties
    logger.info("parameters: #{par.inspect}")
    valid = true

    # find by user associated to app key, not by user from request parameter!
    @image = Image.editable_by(@user).find_by_guid(params[:id])

    return not_found if !@image

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

    # update calibration data if specified
    if !par[:calibrate_length].blank?
      @image.calibrate_length = par[:calibrate_length].to_f
      @image.calibrate_unit   = par[:calibrate_unit].to_i if !par[:calibrate_unit].blank?
      @image.calibrate_coords = par[:calibrate_coords] if !par[:calibrate_coords].blank?
      @image.ppi = calculate_ppi(@image)
    end

    orig_url = par[:original_url] || par[:url]
    begin
      # this may fail
      if !orig_url.blank? && orig_url != @image.original_url
        # url was updated
        @image.remote_upload_url = orig_url
        @image.original_url = orig_url
      end
    rescue CarrierWave::DownloadError
      @image.errors.add(:remote_upload_url, "^This url doesn't appear to be valid")
      valid = false
    rescue CarrierWave::IntegrityError
      @image.errors.add(:remote_upload_url, "^This url does not appear to point to a valid image")
      valid = false
    rescue StandardError
      @image.errors.add(:remote_upload_url, "There does not appear to be an image at this url")
      valid = false
    end

    if valid && @image.save
      # update product if set
      @image.user_product = par[:product] if par[:product]

      image_data = @image.js_serialize
      # if the user hit the 'save and next' button, include the guid of the next image in the response.
      # The client side will redirect to the edit page for that image. 
      if params[:commit] == 'save and next'
        image = Image.find_most_recent_uncalibrated(current_user.id)
        image_data['nextImage'] = image.guid if image
      end
      render :json => image_data, :callback => params[:callback]
    else
      render :json => { :error => 403, :messages => prepare_errors(@image), :callback => params[:callback] }, :status => 200
    end
  end

  # returns all product images for a given user and product id
  def product_images
    user_id, product = params[:user_id], params[:id]
    return bad_request if !user_id || !product
    # returns all images for a given user and product
    images = UserProduct.find_images(user_id, product)
    # create json array
    img = images ? images.collect { |i| i.js_serialize } : []
    render :json => img
  end

  def options()
    head :ok
  end

  protected

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

  # parses properties from request parameters. If coming from rails form, the parameters will be
  # in params[:image] and will have names with underscores.
  # If coming from other apps, parameters will be camelcased, so they'll be converted back to underscored names
  def img_properties
    par = params[:image]
    if !par
      # json webservice call, not coming from rails form. Change all keys from camelcased to underscores
      par = params
      %w(pageUrl originalUrl calibrateLength calibrateUnit calibrateCoords).each do |p|
        par[p.underscore] = par[p]
        par.delete(p)
      end
    end
    par
  end

  def prepare_errors(image)
    errors = image.errors
    err = {}
    errors.keys.each do |k|
      msg = []
      errors[k].each { |m| msg << m.gsub('^', '')}
      err[k] = msg
    end
    p err
    err
  end
end
