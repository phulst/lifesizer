require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe ScreenMatcher do
  before(:each) do
    @screen_id = ScreenMatcher.new
    @screen_res = { :width => 1680, :height => 1050 }
  end

  context "processing" do

    it "should have all checker methods defined" do
      ScreenMatcher::MATCHER_METHODS.each do |method|
        @screen_id.respond_to?(method).should(be_true, "method #{method} not defined")
      end
    end

    it "should find no matches without user agent" do
      req = ActionDispatch::TestRequest.new
      matches = @screen_id.find_matches(req, @screen_res)
      matches.size.should == 0
    end

    it "should find no matches with unknown user agent" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'some unknown agent'
      matches = @screen_id.find_matches(req, @screen_res)
      matches.size.should == 0
    end

    it "should detect an iphone" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_0 like Mac OS X; en-us) AppleWebKit/528.18 (KHTML, like Gecko) Version/4.0 Mobile/7A341 Safari/528.16'
      matches = @screen_id.find_matches(req, nil)
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_IPHONE
      m.confidence.should == ScreenMatch::CONFIDENCE_VERY_HIGH
    end

    it "should detect an ipod" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (iPod; U; CPU like Mac OS X; en) AppleWebKit/420.1 (KHTML, like Gecko) Version/3.0 Mobile/3A101a Safari/419.3'
      matches = @screen_id.find_matches(req, nil)
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_IPOD_TOUCH
      m.confidence.should == ScreenMatch::CONFIDENCE_VERY_HIGH
    end

    it "should detect an ipad" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5'
      matches = @screen_id.find_matches(req, nil)
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_IPAD
      m.confidence.should == ScreenMatch::CONFIDENCE_VERY_HIGH

      matches = @screen_id.find_matches(req, { :width => 768, :height => 1024})
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_IPAD
      m.confidence.should == ScreenMatch::CONFIDENCE_VERY_HIGH
    end

    it "should detect a macbook air 11 inch" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)'
      matches = @screen_id.find_matches(req, { :width => 1366, :height=> 768 })
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_MB_AIR_11
      m.confidence.should == ScreenMatch::CONFIDENCE_HIGH
    end

    # 1440 x 900 screens should be either macbook air 13 or macbook pro 15
    it "should find matches for a 1440x900 Mac screen" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)'
      matches = @screen_id.find_matches(req, { :width => 1440, :height=> 900 })
      matches.size.should == 2
      pro = matches[0]
      pro.screen_info.should == ScreenInfo::SCREEN_MB_PRO_15
      pro.confidence.should == ScreenMatch::CONFIDENCE_MEDIUM
      air = matches[1]
      air.screen_info.should == ScreenInfo::SCREEN_MB_AIR_13
      air.confidence.should == ScreenMatch::CONFIDENCE_LOW
    end

    # this is a 13 inch macbook or macbook pro
    it "should find matches for 1280x800 screens" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)'
      matches = @screen_id.find_matches(req, { :width => 1280, :height=> 800 })
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_MB_13
      m.confidence.should == ScreenMatch::CONFIDENCE_HIGH
    end

    # 1680x1050 is either MB pro 15 hi-res, MB pro 17 or 20" iMac
    it "should find matches for a 1680x1050 Mac screen" do
      req = ActionDispatch::TestRequest.new
      req.cookies[ApplicationController::SCREEN_COOKIE] = '1680x1050'
      req.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)'
      matches = @screen_id.find_matches(req, @screen_res)
      matches.size.should == 3
      # macbook pro 15 hi-res
      mb15 = matches[0]
      mb15.screen_info.should == ScreenInfo::SCREEN_MB_PRO_15_HR
      mb15.confidence.should == ScreenMatch::CONFIDENCE_MEDIUM
      # macbook pro 17
      mb17 = matches[1]
      mb17.screen_info.should == ScreenInfo::SCREEN_MB_PRO_17
      mb17.confidence.should == ScreenMatch::CONFIDENCE_MEDIUM
      # old iMac 20"
      imac = matches[2]
      imac.screen_info.should == ScreenInfo::SCREEN_IMAC_20
      imac.confidence.should == ScreenMatch::CONFIDENCE_VERY_LOW
    end

    # 1920x1200 is a MB pro 17HR, MB pro 15 retina, or a 2007 imac 24
    it "should find matches for a 1920x1200 Mac screen" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)'
      matches = @screen_id.find_matches(req, { :width => 1920, :height=> 1200 })
      matches.size.should == 3
      # macbook pro 17 hi-res
      mb17 = matches[0]
      mb17.screen_info.should == ScreenInfo::SCREEN_MB_PRO_17_HR
      mb17.confidence.should == ScreenMatch::CONFIDENCE_MEDIUM
      # macbook pro 15 retina
      mb15 = matches[1]
      mb15.screen_info.should == ScreenInfo::SCREEN_MB_PRO_15_RT
      mb15.confidence.should == ScreenMatch::CONFIDENCE_MEDIUM
      # old iMac 24" (2007 model)
      im24 = matches[2]
      im24.screen_info.should == ScreenInfo::SCREEN_IMAC_24
      im24.confidence.should == ScreenMatch::CONFIDENCE_LOW
    end

    it "should detect the MB pro retina at 2880x1800" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)'
      matches = @screen_id.find_matches(req, { :width => 2880, :height=> 1800 })
      matches.size.should == 1
      mb = matches[0]
      mb.screen_info.should == ScreenInfo::SCREEN_MB_PRO_15_RT_MAX
      mb.confidence.should == ScreenMatch::CONFIDENCE_HIGH
    end

    it "should detect new imac 21.5 inch" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)'
      matches = @screen_id.find_matches(req, { :width => 1920, :height=> 1080 })
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_IMAC_21
      m.confidence.should == ScreenMatch::CONFIDENCE_MEDIUM
    end

    # detect new imac or thunderbolt display
    it "should detect new imac 27 inch" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)'
      matches = @screen_id.find_matches(req, { :width => 2560, :height=> 1440 })
      matches.size.should == 2
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_IMAC_27
      m.confidence.should == ScreenMatch::CONFIDENCE_MEDIUM
      m = matches[1]
      m.screen_info.should == ScreenInfo::SCREEN_EXT_27
      m.confidence.should == ScreenMatch::CONFIDENCE_LOW
    end

    it "should detect the Barnes & Nobles Nook" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Linux; U; Android 2.2.1; en-us; LogicPD Zoom2 Build/ERD79) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
      matches = @screen_id.find_matches(req, nil)
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_NOOK_COLOR
      m.confidence.should == ScreenMatch::CONFIDENCE_VERY_HIGH
    end

    it "should detect the Nexus 7" do
      req = ActionDispatch::TestRequest.new
      req.user_agent = 'Mozilla/5.0 (Linux; Android 4.1.1; Nexus 7 Build/JRO03D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Safari/535.19'
      matches = @screen_id.find_matches(req, nil)
      matches.size.should == 1
      m = matches[0]
      m.screen_info.should == ScreenInfo::SCREEN_NEXUS_7
      m.confidence.should == ScreenMatch::CONFIDENCE_VERY_HIGH
    end

  end
end
