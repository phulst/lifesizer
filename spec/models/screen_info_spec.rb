require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe ScreenMatcher do
  it "should set all screen properties" do
    si = ScreenInfo.new('name', 100, 200, 120, ScreenInfo::TYPE_MOBILE)
    si.height.should == 200
    si.width.should == 100
    si.name.should == 'name'
    si.ppi.should == 120
    si.screen_type.should == ScreenInfo::TYPE_MOBILE
  end

  it "should return all screen properties in a hash" do
    si = ScreenInfo.new('name', 100, 200, 120, ScreenInfo::TYPE_MOBILE)
    hsh = si.to_hash
    si.height.should == hsh[:height]
    si.width.should == hsh[:width]
    si.name.should == hsh[:name]
    si.ppi.should == hsh[:ppi]
    si.screen_type.should == hsh[:screen_type]
  end

  it "should return screenInfo objects by name" do
    si = ScreenInfo.find_by_name("foo")
    si.should be_nil

    si = ScreenInfo.find_by_name("mb_13")
    si.should == ScreenInfo::SCREEN_MB_13

    si = ScreenInfo.find_by_name("imac_24")
    si.should == ScreenInfo::SCREEN_IMAC_24
  end
end