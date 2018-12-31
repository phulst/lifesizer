module ShowHelper

  # adds default calibrate options (used in _screen_info partial)
  def calibrate_option
    ScreenInfo.new("other", 0, 0, 0, 0)
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
    t('device.android.nook')
  end
end
