require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe Image do

  describe "fetching" do
    before(:each) do
      @img = create :lx5_image,  :ref => 'img1'
      @img2 = create :lx5_image, :ref => 'img2', :featured => 1
      @img3 = create :lx5_image, :ref => nil, :featured => 1
      @img4 = create :lx5_image, :ref => 'img3', :featured => 1, :private => true
    end

    it "should only return public recent images" do
      img = Image.recent_images
      img.each { |i| i.private.should be_false }
      img.size.should == 3
    end

    it "should return all recent images" do
      img = Image.all_recent_images
      img.size.should == 4
    end

    it "should only return public featured images" do
      img = Image.featured_images
      img.each { |i|
        i.private.should be_false
        i.featured.should == 1
      }
      img.size.should == 2
    end

    it "should return images by user and ref" do
      img = Image.find_user_image_by_ref(@img2.user.id, 'img2')
      img.should_not be_nil
      img.ref.should == 'img2'
    end

    it "should return images by user and auto ref" do
      ref = "_#{@img3.auto_ref}"
      img = Image.find_user_image_by_ref(@img3.user.id, ref)
      img.should_not be_nil
      img.image_ref.should == ref
      img.ref.should be_nil
      img.user.id.should == @img3.user.id
    end
  end


  before(:each) do
    @user = create :user
    @valid_attributes = {
      :remote_upload_url => "http://www.lifesizer.com/myimage.jpg",
      :image_type => Image::TYPE_LS,
    }
    stub_http_request(:get, "http://www.lifesizer.com/myimage.jpg").to_return(
        :body => File.new('test/data/images/scissors.jpg'), :status => 200)
    
  end

  it "creates a valid Image given valid attributes" do
    lambda {
      img = Image.new(@valid_attributes)
      img.user = @user
      img.save
    }.should change(Image, :count).by(1)
  end

  it "must have a url" do
    i = Image.new(@valid_attributes.except(:remote_upload_url))
    i.should_not be_valid
    # 'you must either provide url or upload file' error will be set
    i.errors[:base].should_not be_nil
  end

  it "should return image by url" do
    img = create(:lx5_image)
    i = Image.find_lifesize_image_by_url(img.user_id, img.original_url)
    i.should == img
  end

  it "should not return anything for wrong user id" do
    img = create(:lx5_image)
    i = Image.find_lifesize_image_by_url(img.user_id + 1, img.original_url)
    i.should be_nil
  end

  # checks that width and height are automatically set
  it "must have a width and height"  do
    i = Image.new(@valid_attributes)
    i.user = @user
    i.width.should == 1907
    i.height.should == 1577
    i.should be_valid
  end

  pending "should return correct file_id" do
    i = Image.new(@valid_attributes)
    i.save
    i.file_id.should match(/[a-f0-9]{12}/)
  end

  context "calibration" do
    it "should store calibration data correctly" do
      startpnt = "100,200"
      endpnt = "500,600"
      i = Image.new(@valid_attributes)
      i.calibrate_data(startpnt, endpnt)
      i.calibrate_coords.should == "#{startpnt}-#{endpnt}"
    end

    it "should return arrow end" do
      startpnt = "100,200"
      endpnt = "500,600"
      i = Image.new(@valid_attributes)
      i.calibrate_data(startpnt, endpnt)
      i.arrow_end.should == endpnt
    end

    it "should return arrow start" do
      startpnt = "100,200"
      endpnt = "500,600"
      i = Image.new(@valid_attributes)
      i.calibrate_data(startpnt, endpnt)
      i.arrow_start.should == startpnt
    end

    it "should persist unit correctly" do
      i = Image.new(@valid_attributes)
      i.unit = 'cm'
      i.unit.should == 'cm'
      i.unit = 'in'
      i.unit.should == 'in'
      i.unit = 'mm'
      i.unit.should == 'mm'
    end

    it "unit should default to inches" do
      i = Image.new(@valid_attributes)
      i.unit.should == 'in'
    end

    it "bad unit should default to inches" do
      i = Image.new(@valid_attributes)
      i.unit = 'bad_unit'
      i.unit.should == 'in'
    end

    it "should persist input length correctly" do
      i = Image.new(@valid_attributes)
      i.input_length  = '1.2'
      i.input_length.should == 1.2
    end

    it "should convert length properly" do
      i = Image.new(@valid_attributes)
      i.input_length="5"

      i.unit = 'in'
      i.length_in_inches.should == 5

      i.unit = 'cm'
      i.length_in_inches.should == 5 / 2.54

      i.unit = 'mm'
      i.length_in_inches.should == 5 / 25.4
    end
  end

  # tests related to ref / auto_ref
  context "reference" do
    it "should set an auto_ref value" do
      i = Image.new(@valid_attributes)
      i.user = @user
      i.save
      i.image_ref.should match /^_\d+/  # should be a number starting with @
      # if a reference is explicitly set, image_ref should return that
      i.ref = "myref"
      i.image_ref.should == "myref"
    end
  end


  it "should return alt image url" do
    i = Image.new(@valid_attributes)
    i.user = @user

    alt_url = 'http://host.com/myalturl.jpg'
    i.view_url = alt_url
    i.url.should == alt_url

    i.view_url = nil
    i.url.should_not== alt_url
  end

  describe "guid" do
    it "must automatically be set" do
      i = Image.create(@valid_attributes)
      i.guid.should_not be_nil
      i.guid.should match /[a-f0-9]{16}/
    end
  end


  describe "permissions" do
    before :each do
      @user = FactoryGirl.create :user
      @img = FactoryGirl.create :image, :user => @user
    end

    it "may not be edited by others" do
      user2 = FactoryGirl.create :user
      Image.where(:id => @img.id).editable_by(user2).should be_empty
    end

    it "may be edited by owner" do
      Image.where(:id => @img.id).editable_by(@user).length.should == 1
    end

    it "may be edited by admin" do
      admin = FactoryGirl.create :admin
      Image.where(:id => @img.id).editable_by(admin).length.should == 1
    end
  end
end