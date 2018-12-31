module AccountHelper

  # returns true if there's a demo plugin for the current user'
  def has_demo_plugin
    current_user.account_option.demo_browser_plugin
  end

  def demo_plugin_name
    "Chrome plugin for #{api_hostname}"
  end

  def demo_plugin_url
    "/plugin/customer/demo/#{api_hostname}-demo.user.js"
  end

  # returns public api key for current user
  def api_key
    current_user.api_keys.each do |key|
      if (key.access_type == ApiKey::ACCESS_TYPE_READ || key.access_type.nil?)
        return key.key
      end
    end
    nil
  end

  # returns secret key for current user
  def secret_key
    current_user.api_keys.each do |key|
      if (key.access_type == ApiKey::ACCESS_TYPE_WRITE)
        return key.key
      end
    end
    nil
  end

  def api_hostname
    keys = current_user.api_keys
    keys.length > 0 ? keys.first.hostname : nil
  end
end
