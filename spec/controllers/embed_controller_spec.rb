require 'spec_helper'

describe EmbedController do

  describe "GET 'index'" do
    it "should be successful" do
      get 'index'
      response.should be_success
    end
  end

  describe "GET 'app_key'" do
    it "should be successful" do
      get 'app_key'
      response.should be_success
    end
  end

  describe "instructions" do
    before :each do
      @user = create :user
      @img = create :lx5_image,  :ref => 'lx5', :user => @user
      sign_in @user
    end

    it "should be successful" do
      get 'instructions'
      response.should be_success
      # the image displayed should be the user's own image
      assigns(:image).ref.should == @img.image_ref
    end
  end

end
