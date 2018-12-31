require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe ScreenUtils do

  context "calculated biggest possible" do
    it "should only increase resolution to twice the original" do
      img = stub(:width => 100, :height => 100)
      dims = ScreenUtils.calculate_biggest_display_dimensions_possible(img, 600, 800)
      dims[0].should == 200
      dims[1].should == 200

      img = stub(:width => 200, :height => 400)
      dims = ScreenUtils.calculate_biggest_display_dimensions_possible(img, 1000, 600)
      dims[0].should == 300
      dims[1].should == 600

      img = stub(:width => 400, :height => 200)
      dims = ScreenUtils.calculate_biggest_display_dimensions_possible(img, 600, 1000)
      dims[0].should == 600
      dims[1].should == 300

      img = stub(:width => 1200, :height => 1200)
      dims = ScreenUtils.calculate_biggest_display_dimensions_possible(img, 1000, 600)
      dims[0].should == 600
      dims[1].should == 600

      img = stub(:width => 1000, :height => 1200)
      dims = ScreenUtils.calculate_biggest_display_dimensions_possible(img, 1200, 1500)
      dims[0].should == 1200
      dims[1].should == 1440
    end
  end

  context "fit in box" do
    it "should correctly fit to a square box" do
      # this should increase size to 800
      dims = ScreenUtils.fit_to_box(400,400,800,800)
      dims[0].should == 800
      dims[1].should == 800

      # this should reduce size to 800
      dims = ScreenUtils.fit_to_box(1200,1200,800,800)
      dims[0].should == 800
      dims[1].should == 800

      # this should keep size the same at 800
      dims = ScreenUtils.fit_to_box(800,800,800,800)
      dims[0].should == 800
      dims[1].should == 800

      # this should fit a landscape container in the square
      dims = ScreenUtils.fit_to_box(300,400,800,800)
      dims[0].should == 600
      dims[1].should == 800

      # this should fit a portrait container in the square
      dims = ScreenUtils.fit_to_box(400,300,800,800)
      dims[0].should == 800
      dims[1].should == 600
    end

    it "should correctly fit to portrait box" do
      # this should increase size to 600x800
      dims = ScreenUtils.fit_to_box(300,400,600,800)
      dims[0].should == 600
      dims[1].should == 800

      # this should reduce size to 600x800
      dims = ScreenUtils.fit_to_box(1200,1600,600,800)
      dims[0].should == 600
      dims[1].should == 800

      # fit a square within
      dims = ScreenUtils.fit_to_box(300,300,600,800)
      dims[0].should == 600
      dims[1].should == 600

      # fit a landscape within
      dims = ScreenUtils.fit_to_box(400,300,600,800)
      dims[0].should == 600
      dims[1].should == 450
    end

    it "should not enlarge images if requested" do
      dims = ScreenUtils.fit_to_box(200,200,200,300,false)
      dims[0].should == 200
      dims[1].should == 200

      dims = ScreenUtils.fit_to_box(200,200,300,300,false)
      dims[0].should == 200
      dims[1].should == 200
    end
  end
  
end