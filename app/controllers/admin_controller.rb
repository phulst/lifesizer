class AdminController < ApplicationController
  before_filter :authenticate_admin!, :except => :device_info

  before_filter :screen_config, :only => [:images]
  before_filter :lifesize, :only => [:images]

  handset_detection

  #layout nil

  def index
  end

  # uses the handsetdetection API to determine the mobile device used. Also logs results to a mobile.log file
  def handset_detect
    sel_hdr = ["Accept","Accept-Language","Accept-Encoding","Connection","Cache-Control","User-Agent","x-wap-profile"]
    hdr = {}
    sel_hdr.each { |v| hdr[v] = request.headers[v] if request.headers[v] }
    # hdr['options'] = 'general_model' #options don't work with V3
    logger.info("sending headers from #{request.remote_ip}: #{hdr.inspect}")

    resp = nil
    time = Benchmark.measure do
      resp = detect(hdr)
    end
    data = JSON.parse(resp)
    logger.info("response time #{time} : #{data.inspect}")

    # log response data to mobile.log
    sp = data['hd_specs']
    msg = "#{Time.now} | #{request.remote_ip} | "
    if sp
      msg += "#{sp['general_vendor']} | #{sp['general_model']} | #{sp['display_size']} | #{sp['display_x']} | #{sp['display_y']} | #{data['class']}"
    else
      msg += "#{data['status']} | #{data['message']} | #{request.headers['user-agent']}"
    end
    mobile_logger.info(msg)
    data
  end

  # before calling this, use mobile-fu to determine that we're indeed dealing with a mobile device...
  # saves a lot of overhead.
  def mobile_ppi
    @detect_data = handset_detect
    if @detect_data['status'] != 0
      # not found, can't determine ppi
      # TODO: use local screen matchers
      return false
    end

    sp = @detect_data['hd_specs']
    # if general_vendor and general_model are set, try to look up the ppi in our database
    model_data = { :vendor => sp['general_vendor'], :model => sp['general_model'] }
    model_data[:display_size] = sp['display_size'].to_f rescue nil
    model_data[:resolution_x] = sp['display_x'].to_i rescue nil
    model_data[:resolution_y] = sp['display_y'].to_i rescue nil

    # find or create device for this
    device = Device.find_or_create_device(model_data)
    ppi = device.ppi / device.device_pixel_ratio
    logger.info("detected a #{device.vendor} #{device.model} with ppi #{ppi}")
    ppi
  end

  def device_info
    mobile_ppi

    data = params[:device_data]
    if data
      logger.warn("\n\nDEVICE DATA FOR #{params[:name]}")
      logger.warn(params[:device_data])
    end
  end

  def images
    page = params[:page].try(:to_i) || 1
    @images = Image.all_recent_images(page)
  end

  # ajax request, changes featured state for the given image
  def change_featured
    @image = Image.find_by_guid(params[:id])
    featured = @image.featured
    featured = (!featured.nil? && featured > 0) ? 0 : 1
    @image.update_attributes(:featured => featured)
    render 'update_image'
  end

  def change_private
    @image = Image.find_by_guid(params[:id])
    puts "before: #{@image.private} but shoudl become #{!@image.private}"
    @image.update_attributes(:private => !@image.private)
    @image.reload
    puts "private value is now: #{@image.private}"
    render 'update_image'
  end

  # deletes an image
  def delete_image
    @image = Image.find_by_guid(params[:id])
    @image.destroy

    respond_to do |format|
      format.html { redirect_to(admin_images_path) }
    end
  end

  # update the image viewer cached assets
  def update_image_cache
    cc = CloudCache.new
    cc.delay.save_viewer_files
    flash[:notice] = "image viewer assets are being updated"
    render :index
  end

  # update the embed scripts
  def update_embed_cache
    cc = CloudCache.new
    cc.delay.save_embed_files
    flash[:notice] = "embed files are being updated"
    render :index
  end

  # screen size test
  def screen_test
    render :screen_test, :layout => false
  end

  def update_bookmarklet_files
    cc = CloudCache.new
    cc.delay.save_bookmarklet_files
    flash[:notice] = 'bookmarklet files are being reloaded'
    render :index
  end

  def update_shared_files
    cc = CloudCache.new
    cc.delay.save_web_files
    flash[:notice] = 'shared WP/Rails files are being reloaded'
    render :index
  end

  # become any other user
  def become_user
    user = User.find_by_id(params[:user_id])
    if user
      logger.info("#{current_user.email} is now becoming user: #{user.email}")
      sign_in(:user, user)
      session[:admin] = true
    end
    redirect_to :action => :users
  end

  # render the user list view
  def users
    @users = User.order("created_at")
  end

  # renders the user option view
  def options
    @user = User.find(params[:id])

    @custom_bookmarklets = CustomBookmarklet.all
    set_bookmarklet_vars(@user)
  end

  # submits form to generate or save api keys and domain name
  def api_options
    commit = params[:commit]
    user_id = params[:user]
    user = User.find_by_id(user_id)

    if commit == 'create read key' && user
      ApiKey.generate(user, nil, ApiKey::ACCESS_TYPE_READ)
    elsif commit == 'create secret key'
      ApiKey.generate(user, nil, ApiKey::ACCESS_TYPE_WRITE)
    else
      read_key = ApiKey.find_read_key(user)
      if (!read_key)
        read_key = ApiKey.new(:access_type => ApiKey::ACCESS_TYPE_READ)
      end
      read_key.hostname = params[:hostname]
      read_key.key = params[:public_key]

      write_key = ApiKey.find_write_key(user)
      if (!write_key)
        write_key = ApiKey.new(:access_type => ApiKey::ACCESS_TYPE_WRITE)
      end
      write_key.hostname = params[:hostname]
      write_key.key = params[:secret_key]

      read_key.save
      write_key.save
      flash[:notice] = "API settings saved"
    end
    redirect_to :action => :options, :id => user_id
  end

  def submit_options
    @user = User.find(params[:user_id])
    if params[:edit_bookmarklet]
      # edit the selected bookmarklet, or go to bookmarklet list page if user has generic bookmarklet
      cb = params[:custom_bookmarklet]
      if cb.blank?
        redirect_to :controller => :custom_bookmarklets, :action => :index
      else
        redirect_to :controller => :custom_bookmarklets, :action => :edit, :id => params[:custom_bookmarklet]
      end
      return
    else
      # save bookmarklet options

      @account_option = @user.account_option
      @account_option.bookmarklet = (params[:visible] == 'yes')
      cb = params[:custom_bookmarklet]
      @account_option.custom_bookmarklet = cb.blank? ? nil : CustomBookmarklet.find(cb.to_i)
      @account_option.save!

      flash[:notice] = "Account options saved"
    end

    redirect_to :action => :options, :id => @user.id
  end

  # updates the user caches and purges content with CDN
  def sync_image_cache
    #begin
      user = User.find(params[:user_id])
      if user
        user.api_keys.each do |key|
          if (key.access_type == ApiKey::ACCESS_TYPE_READ || key.access_type.nil?)
            logger.info("updating and purging image cache for #{user.email} to CloudFiles")
            CloudCache.new.delay.save_user_cache(key.key, true)
            break
          end
        end
      end
    #rescue
    #  logger.error("can't find user #{params[:user_id]}, unable to purge cache")
    #end

    redirect_to :action => :options, :id => params[:user_id]
  end

  def sync_bookmarklet
    @user = User.find(params[:user_id])
    # save bookmarklet to cloud
    set_bookmarklet_vars(@user)

    if @account_option.custom_bookmarklet && @key
      cc = CloudCache.new
      cc.delay.save_custom_bookmarklet(@key.key, @account_option.custom_bookmarklet.script)
      flash[:notice] = 'bookmarklet files are being synced to cloud...'
    else
      flash[:error] = "no write key or no custom bookmarklet selected... can't sync.'"
    end

    redirect_to :action => :options, :id => params[:user_id]
  end

  def mobile_logger
    @@mobile_logger ||= Logger.new("#{Rails.root}/log/mobile.log")
  end
end
