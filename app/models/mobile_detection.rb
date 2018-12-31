module MobileDetection

  def self.included(base)
    #base.has_mobile_fu false
    base.has_mobile_fu
    base.handset_detection
  end

  # before filter.
  # This will attempt to determine the mobile device (if the request came from a mobile device)
  # by examining the lifesize cookie and/or by using the handhelddetection API.
  # Current device data will then be stored in the cookie, so that API lookup only needs to
  # occur once.
  #
  # Will set the following instance variables:
  # mobile_match : true or false
  # mobile_device_name : full display name of device detected
  # lifesize : LifeSize object used for rendering image
  #
  def mobile_detect
    logger.info("request from tablet device") if is_tablet_device?
    logger.info("request from mobile device") if is_mobile_device?

    #for header in request.env.select {|k,v| k.match("^HTTP.*")}
    #  puts "#{header} = #{request.env[header]}"
    #end

    # first use mobile-fu methods to determine if we have a mobile device at all.
    if is_mobile_or_tablet?
      # find out device and ppi
      # attempt 1: check LifeSize cookie
      screen_data = ScreenData.new(cookies[ApplicationController::LIFESIZE_COOKIE])
      stored_config = screen_data.first_config # on mobile, there should only ever be one screen config in the cookie

      device = nil
      if stored_config
        # found a device config in cookie, attempt to look it up. Even though the ppi is stored in the cookie,
        # we'll use the value from the database since it may have been changed/corrected.
        # We also use the Device to get the display name
        device = Device.by_device_id(stored_config[:name])
        logger.info("detected device #{device.display_name} from cookie") if device
      end
      if !(device && device.can_render_images_on?)
        # no stored config or device couldn't be found. Use handset detection to find it
        device = lookup_mobile_device
        if device
          logger.info("detected device #{device.display_name} using handsetdetection")
        else
          # give up, couldn't look up mobile device. Render non-mobile view instead
          logger.error("problem with handsetdetection, unable to detect mobile device for request with user agent: #{request.headers['user-agent']}")
          request.format = :html
          return true
        end
      end

      # use the device pixel ratio from the Device model, unless that device has not yet been verified
      # AND the device pixel ratio was set in the request
      device_pixel_ratio = device.device_pixel_ratio
      if params[:r]
        if !device.verified?
          # device isn't verified yet, use pixel ratio from request
          device_pixel_ratio = params[:r].to_f
          logger.info("device #{device.display_name} not yet verified, using device pixel ratio #{device_pixel_ratio} from request")
        elsif params[:r].to_f != device_pixel_ratio
          # known pixel ratio for this device is not the same as what we received in the request. Log this, but don't act on it:
          # assume the info in our db to be accurate.
          logger.warn("verified #{device.display_name} has pixel ratio #{device_pixel_ratio}, but doesn't match value from request: #{params[:r]}")
        end
      end

      config = nil
      if device && device.can_render_images_on?
        # only if we have a device and PPI and resolution is known
        config = { :width => (device.resolution_x / device_pixel_ratio).round,
                   :height => (device.resolution_y / device_pixel_ratio).round,
                   :ppi => device.ppi / device_pixel_ratio,
                   :name => device.device_id
        }
        @mobile_match = true
        @mobile_device_name = device.display_name
      else
        # couldn't detect device. See if we can detect it locally
        config = local_handheld_detect
        if config
          logger.info("able to detect mobile/tablet #{config[:name]} with local matchers")
          @mobile_match = true
          @mobile_device_name = I18n.t(".screen.#{config[:name]}")
        else
          logger.info("unable to detect handset")
          config = { :ppi => 160, :name => 'unknown', :width => 0, :height => 0 }
          @mobile_match = false
          @mobile_device_name = 'Unknown'
        end
      end
      screen_data.clear # delete any previously stored screens
      cookie = screen_data.save_screen_config(config[:width], config[:height], {:ppi => config[:ppi], :name => config[:name]})
      cookies[ApplicationController::LIFESIZE_COOKIE] = cookie

      request.format = :mobile
      @lifesize = LifeSize.new(config)
    end
    true
  end

  # attempts to detect mobile or tablet device using local techniques. Will return a config if
  # successful
  def local_handheld_detect
    current_screen_res
    if @screen_res != ApplicationController::UNKNOWN_SCREENRES
      screen_matches = @screen_identifier.find_matches(request, @screen_res)
      logger.info("found #{screen_matches.size} matches")
      p screen_matches
      if screen_matches.size > 0
        si = screen_matches[0].screen_info
        if [ScreenInfo::TYPE_MOBILE, ScreenInfo::TYPE_TABLET].include?(si.screen_type)
          # have a tablet/mobile match
          return { :ppi => si.ppi, :width => si.width, :height => si.height, :name => si.name }
        end
      end
    end
    nil
  end

  # evaluates to true if the current request came from a mobile or tablet device
  def is_mobile_or_tablet?
    # mobile_fu's method
    is_mobile_device? || is_tablet_device?
  end

  # determines mobile device by calling handset_detect, then looks up this device in our
  # own Device table to find the correct PPI, css width and height. If no local device exists yet, the PPI
  # will be determined based on the known physical dimensions and screen resolution
  # retrieved from handsetdetection API.
  def lookup_mobile_device
    # don't use handsetdetection in test environment
    return mock_device if Rails.env.test?

    sp = nil
    begin
      @detect_data = handset_detect
      if !@detect_data || @detect_data['status'] != 0
        # not found, can't determine ppi
        # TODO: use local screen matchers
        logger.warn("unable to determine PPI using handset detection: \n#{@detect_data}")
        return false
      end
      sp = @detect_data['hd_specs']
    rescue => err
      logger.error(err)
      return false
    end

    # if general_vendor and general_model are set, try to look up the ppi in our database
    model_data = { :vendor => sp['general_vendor'], :model => sp['general_model'] }
    model_data[:display_size] = sp['display_size'].to_f rescue nil
    model_data[:resolution_x] = sp['display_x'].to_i rescue nil
    model_data[:resolution_y] = sp['display_y'].to_i rescue nil
    model_data[:device_type]  = @detect_data['class'].downcase rescue nil

    # find or create device for this
    Device.find_or_create_device(model_data)
  end

  def mock_device
    # for testing, support ios and android
    if request.env['X_MOBILE_DEVICE'] == 'iphone'
      Device.find_or_create_device({ :vendor => 'Apple', :model => 'iPhone', :display_size => 3.5, :resolution_x => 320, :resolution_y => 480, :device_type => 'mobile' })
    elsif request.env['X_MOBILE_DEVICE'] == 'android'
      Device.find_or_create_device({ :vendor => 'Google', :model => 'Nexus 7', :display_size => 7, :resolution_x => 1280, :resolution_y => 800, :device_type => 'tablet' })
    else
      false
    end
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

  def mobile_logger
    @@mobile_logger ||= Logger.new("#{Rails.root}/log/mobile.log")
  end
end
