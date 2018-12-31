require 'spec_helper'

# Specs in this file have access to a helper object that includes
# the WidgetHelper. For example:
#
# describe WidgetHelper do
#   describe "string concat" do
#     it "concats two strings with spaces" do
#       helper.concat_strings("this","that").should == "this that"
#     end
#   end
# end
describe ShowHelper do

  it "should return the 'other' calibrate option" do
    cal = helper.calibrate_option
    cal.should be_a(ScreenInfo)
    cal.name.should == 'other'
    cal.width.should == 0
    cal.height.should == 0
    cal.ppi.should == 0
    cal.screen_type == ScreenInfo::TYPE_UNKNOWN
  end

  it "should return ipad name" do
    # set the request
    helper.request = ActionDispatch::TestRequest.new
    helper.request.user_agent = 'Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5'

    helper.ios_device_type.should == 'iPad'
  end

  it "should return ipod name" do
    # set the request
    helper.request = ActionDispatch::TestRequest.new
    helper.request.user_agent = 'Mozilla/5.0 (iPod; U; CPU like Mac OS X; en) AppleWebKit/420.1 (KHTML, like Gecko) Version/3.0 Mobile/3A101a Safari/419.3'

    helper.ios_device_type.should == 'iPod'
  end

  it "should return iphone name" do
    # set the request
    helper.request = ActionDispatch::TestRequest.new
    helper.request.user_agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3'

    helper.ios_device_type.should == 'iPhone'
  end

  it "should return unknown name" do
    # set the request
    helper.request = ActionDispatch::TestRequest.new
    helper.request.user_agent = 'Mozilla/5.0 (something else; CPU ios OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3'

    helper.ios_device_type.should == 'iOS device'
  end

  it "should return Nook device type" do
    helper.request = ActionDispatch::TestRequest.new
    helper.request.user_agent = 'Mozilla/5.0 (Linux; U; Android 2.2.1; en-us; LogicPD Zoom2 Build/ERD79) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'

    helper.android_device_type.should == 'Nook'
  end

  it "should return Nexus 7 device type" do
    helper.request = ActionDispatch::TestRequest.new
    helper.request.user_agent = 'Mozilla/5.0 (Linux; Android 4.1.1; Nexus 7 Build/JRO03D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Safari/535.19'

    helper.android_device_type.should == 'Nexus 7'
  end
end
