module PluginHelper

  def plugin_name
    api_hostname.split('.')[0]
  end

  def plugin_hostmatch
    "*://*.#{plugin_hostname}/*"
  end

  def plugin_hostname
    api_hostname
  end
end
