require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe ScreenMatch do
  
  it "should store properties" do
    match = ScreenMatch.new(ScreenInfo::SCREEN_MB_PRO_15, ScreenMatch::CONFIDENCE_HIGH)
    match.screen_info.should == ScreenInfo::SCREEN_MB_PRO_15
    match.confidence.should == ScreenMatch::CONFIDENCE_HIGH
  end
end
