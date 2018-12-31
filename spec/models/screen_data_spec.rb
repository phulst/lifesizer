require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe ScreenData do

  before :each do
    @json = '[{"w":1440,"h":900,"p":120.0},{"w":1680,"h":1024,"p":132.0}]'
    @cookie_value = Crypt.encrypt @json
    @screen_cookie = ScreenData.new(@cookie_value)
  end

  it "should correctly initialize the screen_cookie class" do
    @screen_cookie.cookie_value.should == @json
  end

  it "should return valid cookie data" do
    cookie = @screen_cookie.cookie

    Crypt.decrypt(cookie[:value]).should == @json
    cookie[:expires].should be_a_kind_of(Time)
  end

  it "should return the correct screen config" do
    cfg = @screen_cookie.screen_config(1680,1024)
    cfg[:width].should == 1680
    cfg[:height].should == 1024
    cfg[:ppi].should == 132.0

    cfg = @screen_cookie.screen_config(800,600)
    cfg.should be_nil
  end

  it "should return the ppi" do
    @screen_cookie.find_ppi(1680,1024).should == 132.0
    @screen_cookie.find_ppi(1680,1048).should be_nil
  end

  it "should update and save the ppi setting" do
    # save with current ppi setting, cookie should be unchanged
    cookie = @screen_cookie.save_screen_config(1680, 1024, :ppi => 132.0)
    Crypt.decrypt(cookie[:value]).should == @json

    # save with updated ppi setting
    cookie = @screen_cookie.save_screen_config(1680, 1024, :ppi => 126.0)
    Crypt.decrypt(cookie[:value]).should == '[{"w":1440,"h":900,"p":120.0},{"w":1680,"h":1024,"p":126.0}]'

    # save a new dimension/ppi combo, array of resolutions should be bigger
    cookie = @screen_cookie.save_screen_config(1920, 1200, :ppi => 100.0)
    Crypt.decrypt(cookie[:value]).should == '[{"w":1440,"h":900,"p":120.0},{"w":1680,"h":1024,"p":126.0},{"w":1920,"h":1200,"p":100.0}]'
  end

  it "should remove a saved name if config overwritten" do
    json = '[{"w":1440,"h":900,"p":120.0},{"w":1680,"h":1050,"p":128.0,"n":"mb_pro_15_hr"}]'
    cookie_value = Crypt.encrypt json
    sd = ScreenData.new(cookie_value)
    # now update the setting
    cookie = sd.save_screen_config(1680, 1050, :ppi => 125)
    Crypt.decrypt(cookie[:value]).should == '[{"w":1440,"h":900,"p":120.0},{"w":1680,"h":1050,"p":125.0}]'
  end

  it "should store at most 10 screen configs" do
    # add 10 configs
    @screen_cookie.save_screen_config(1900, 1200, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1210, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1220, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1230, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1240, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1250, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1260, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1270, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1280, :ppi => 100.0)
    @screen_cookie.save_screen_config(1900, 1290, :ppi => 100.0)

    configs = JSON.parse(@screen_cookie.cookie_value)
    configs.size.should == 10
  end
end