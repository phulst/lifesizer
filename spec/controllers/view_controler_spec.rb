require "spec_helper"

describe ViewController do

  describe "viewer" do
    before :each do
      # create
      @user = create(:user)
      @user2 = create(:user)
      @img1 = create(:lx5_image, :ref => 'ref1', :user => @user, :user_product => 'cameras')
      @img2 = create(:lx5_image, :ref => 'ref2', :user => @user, :user_product => 'cameras')
      @img3 = create(:lx5_image, :ref => 'ref3', :user => @user, :user_product => 'rx100')
      @img4 = create(:lx5_image, :ref => 'ref4', :user => @user)
      @img5 = create(:lx5_image, :ref => 'ref5', :user => @user2, :user_product => 'rx100')
    end

    it "should render view with a single image specified by ref" do
      get "index", { :user => @img1.user_id, :ref => @img1.ref}
      images = assigns(:images)
      images.size.should == 1
    end

    it "should render view with multiple images specified by ref" do
      get "index", { :user => @img1.user_id, :ref => "#{@img1.ref},#{@img2.ref},#{@img3.ref}"}
      images = assigns(:images)
      images.size.should == 3
      images.should == [@img1, @img2, @img3]
    end

    it "should ignore unknown refs" do
      get "index", { :user => @img1.user_id, :ref => "#{@img1.ref},something_else"}
      images = assigns(:images)
      images.size.should == 1
      images.should == [@img1]
    end

    it "should return multiple images when product specified" do
      get "index", { :user => @img1.user_id, :ref => @img1.ref, :p => 'cameras'}
      images = assigns(:images)
      images.size.should == 2
    end

    it "should return image specified by ref as first" do
      get "index", { :user => @img1.user_id, :ref => @img1.ref, :p => 'cameras'}
      images = assigns(:images)
      images.size.should == 2
      images.should == [@img1, @img2] #img1 should be primary image

      get "index", { :user => @img1.user_id, :ref => @img2.ref, :p => 'cameras'}
      images = assigns(:images)
      images.size.should == 2
      images.should == [@img2, @img1] #img2 should be primary image
    end

    it "should not return images with same product from different user" do
      get "index", { :user => @img3.user_id, :ref => @img3.ref, :p => 'rx100'}
      images = assigns(:images)
      images.size.should == 1 # should not return rx100 image from user2
      images[0].ref.should == @img3.ref
    end
  end

  describe "mobile views" do
    before :each do
      @img = create(:lx5_image)
    end

    render_views
    it "should render iOS views" do
      ios_agent = 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_0 like Mac OS X; en-us) AppleWebKit/528.18 (KHTML, like Gecko) Version/4.0 Mobile/7A341 Safari/528.16'
      request.env['HTTP_USER_AGENT'] = ios_agent
      # usually mobile-detect would set this but that's in Rack middleware which is not activated in unit tests
      request.env['X_MOBILE_DEVICE'] = 'iphone'
      get 'index', {:ref => @img.image_ref, :user => @img.user.id }
      response.should be_success
      response.should_not render_template('layouts/view_popup')
      response.body.should include("In actual size on your Apple iPhone")
    end

    it "should render Android views" do
      agent = 'Mozilla/5.0 (Linux; Android 4.1.1; Nexus 7 Build/JRO03D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Safari/535.19'
      request.env['HTTP_USER_AGENT'] = agent
      # usually mobile-detect would set this but that's in Rack middleware which is not activated in unit tests
      request.env['X_MOBILE_DEVICE'] = 'android'

      get 'index', :ref => @img.image_ref, :user => @img.user.id, :format => :android

      response.should be_success
      response.should_not render_template('layouts/view_popup')
      response.body.should include("In actual size on your Google Nexus 7")
    end
  end
end