require 'spec_helper'


describe ApplicationController do

  # add action to Application controller so we can test it
  controller do
    before_filter :screen_config

    def index
      render :nothing => true
    end
  end

  describe 'get screen resolution' do
    it "should get from parameters" do
      get :index, { :h => 1200, :w => 1900 }
      screenres = assigns(:screen_res)
      screenres[:width].should == 1900
      screenres[:height].should == 1200
    end

    it "should get from cookie" do
      request.cookies['screen'] = '1900x1200'
      get :index
      screenres = assigns(:screen_res)
      screenres[:width].should == 1900
      screenres[:height].should == 1200
    end

    it "params should override cookie" do
      request.cookies['screen'] = '1900x1200'
      get :index, { :w => 1600, :h => 1024 }
      screenres = assigns(:screen_res)
      screenres[:width].should == 1600
      screenres[:height].should == 1024
      # cookie should have been updated
      response.cookies['screen'].should == '1600x1024'
    end
  end

  describe 'user cookies' do
    @guid = nil

    context "when logged in" do
      login_user

      it "cookies should be set correctly" do
        get :index
        response.cookies[ApplicationController::LOGGED_IN_COOKIE].should == @user.email
        @guid = response.cookies[ApplicationController::USER_COOKIE]
        @guid.length.should == 36 # should be Guid

        # after sign out, the LOGGED_IN cookie should no longer be there
        sign_out @user
        get :index
        response.cookies[ApplicationController::LOGGED_IN_COOKIE].should be_nil
        response.cookies[ApplicationController::USER_COOKIE].should == @guid # user cookie should remain
      end
    end
  end
end
