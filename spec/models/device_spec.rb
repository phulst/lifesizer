require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe Device do

  context "find or create" do

    it "should match and return an existing device" do
      device = create :device
      data = { :model => device.model, :vendor => device.vendor}
      dev = Device.find_or_create_device(data)
      dev.should == device
    end

    it "should create a new device if it doesn't exist yet" do
      device = create :device
      data = { :model => "ipod", :vendor => device.vendor}
      dev = Device.find_or_create_device(data)
      dev.should_not == device
      dev.model.should == "ipod"
      dev.vendor.should == device.vendor
      dev.device_pixel_ratio.should == 1.0
    end

    it "should set sizes and ppi" do
      data = { :model => "ipod", :vendor => "apple", :resolution_x => 1024, :resolution_y => 768,
        :display_size => 9.7}
      dev = Device.find_or_create_device(data)
      dev.resolution_x.should == 1024
      dev.resolution_y.should == 768
      dev.display_size.should == 9.7
      dev.ppi.should be_within(0.1).of(132)
    end
  end

end