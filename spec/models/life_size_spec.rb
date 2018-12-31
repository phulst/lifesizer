require File.join(File.dirname(__FILE__), "/../spec_helper" )


describe LifeSize do

  before(:each) do
    @screen_config = { :width => 1440, :height => 900, :ppi => 120.0 }
    @lifesize = LifeSize.new(@screen_config)
  end

  it "should remember the screen configuration" do
    @lifesize.screen_config.should equal(@screen_config)
    @lifesize.height.should == @screen_config[:height]
    @lifesize.width.should == @screen_config[:width]
    @lifesize.ppi.should == @screen_config[:ppi]
    # test ppi setter
    @lifesize.ppi = 140.0
    @lifesize.ppi.should == 140.0
  end

  it "should correctly calculate render dimensions" do
    image = Image.new( :width => 200, :height => 200, :ppi => 240 )
    dims = @lifesize.image_size(image)
    dims[:width].should equal(100)
    dims[:height].should equal(100)

    # 150x300 image at 150ppi should be rendered as 120x240 on a 120ppi screen
    image = Image.new( :width => 150, :height => 300, :ppi => 150 )
    dims = @lifesize.image_size(image)
    dims[:width].should equal(120)
    dims[:height].should equal(240)
  end

  it "should correctly calculate screen ppi from lifesize calibration image" do
    # calibration image is 200ppi and 600 pixels wide, so 3 inches
    cal_image_ppi = 200
    cal_image_width = 600

    ls_width = 450 # this calibration image renders lifesize at 450 pixels wide
    # this must mean the screen is 450/3 = 150ppi

    ppi = @lifesize.calc_screen_ppi_with_calibration_image(cal_image_ppi, cal_image_width, ls_width)
    ppi.should == 150
    @lifesize.screen_config[:ppi].should == 150

    # this should round ppi to 2 decimal precision
    ppi = @lifesize.calc_screen_ppi_with_calibration_image(cal_image_ppi, cal_image_width, 400)
    ppi.should == 133.33
    @lifesize.screen_config[:ppi].should == 133.33
  end

  it "should calculate the screen diameter" do
    @screen_config = { :width => 300, :height => 400, :ppi => 100 }
    @lifesize = LifeSize.new(@screen_config)

    diameter = @lifesize.screen_diameter
    diameter.should == 5.0
  end

  it "should calculate the screen dimensions" do
    @lifesize.screen_config = { :width => 400, :height => 300, :ppi => -1 }
    dim = @lifesize.calc_screen_dimensions(5.0)
    dim[:width].should == 4.0
    dim[:height].should == 3.0
  end

  it "should calculate the image ppi" do
    img_width = 360
    img_render_width = 180
    # if the image width is 360 and lifesize display on a 120 ppi screen would have to
    # render it at 180 pixels, then the image ppi must be 240
    image_ppi = @lifesize.calc_image_ppi(img_width, img_render_width)
    image_ppi.should == 240
  end

  it "should calculate the image ppi using an arrow" do
    arrow_pix = 200
    arrow_len = 4
    image_width = 400
    image_render_width = 200

    image_ppi = @lifesize.calc_image_ppi_with_arrow(arrow_pix, arrow_len, image_width, image_render_width)
    image_ppi.should == 100
  end
end
