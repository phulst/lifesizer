module ViewHelper

  # returns a json string for all images
  def images_json(images)
    img = []
    images.each do |i|
      img_obj = i.to_js_obj
      sz = @lifesize.image_size(i)
      img_obj[:rw] = sz[:width]
      img_obj[:rh] = sz[:height]
      img << img_obj
    end
    raw img.to_json
  end

  def screen_matches
    matches = []
    @screen_matches.each do |match|
      m = match.to_js_obj

      matches << m
    end
    matches << { :t => 'not sure / other external display', :n => 'other' }

    raw matches.to_json
  end

  def screen_res
    [@screen_config[:width],@screen_config[:height]].to_json
  end

  # returns screen properties
  def screen_data
    {
      :cal   => @calibrated,
      :ppi   => @screen_config[:ppi],
      :res   => [@screen_config[:width],@screen_config[:height]],
      :name  => @screen_config[:name],
      :diam  => @lifesize.screen_diameter
    }.to_json
  end

    # returns the iOS device type, either 'iPad', 'iPhone', 'iPod' or 'mobile device'
  # (the latter should never happen)
  def ios_device_type
    case request.user_agent
      when /(iPad)/
        t('device.ios.ipad')
      when /(iPhone)/
        t('device.ios.iphone')
      when /(iPod)/
        t('device.ios.ipod')
      else
        t('device.ios.ios_device')
    end
  end

  # returns the android device type. Currently only supporting Nook
  def android_device_type
    case request.user_agent
      when /(LogicPD\sZoom2)/
        t('device.android.nook')
      when /(Nexus\s7)/
        t('device.android.nexus7')
      else
        t('device.android.android_device')
    end
  end
end