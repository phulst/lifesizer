class PluginController < ApplicationController
  layout nil

  # customer browser plugins
  def customer
    render "#{params[:id]}.user.js", :content_type => 'text/javascript'
  end

  # customer browser plugins
  def customer_demo
    render "plugin/demo/#{params[:id]}.user.js", :content_type => 'text/javascript', :layout => '../plugin/demo/demo_plugin_layout'
  end
end
