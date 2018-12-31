require 'spec_helper'

describe ShowController do


  describe "lifesize view" do
    before(:each) do
      @img = create(:lx5_image)
    end

    pending "should render a response" do
      get 'index', :ref => @img.image_ref, :user => @img.user.id
      response.should be_success
      response.should render_template('show/index')
    end
  end

  describe "lifesize view on iPad" do
    before(:each) do
      @img = create(:lx5_image)
      @request.env['HTTP_USER_AGENT'] = USER_AGENTS[:ipad]
    end

    pending "should render the correct view" do
      get 'index', :ref => @img.image_ref, :user => @img.user.id
      response.should be_success
      response.should render_template('show/index')
      response.request.params[:format].should == 'ios'
    end
  end

  describe "lifesize view on Nook" do
    before(:each) do
      @img = create(:lx5_image)
      @request.env['HTTP_USER_AGENT'] = USER_AGENTS[:nook]
    end

    pending "should render the correct view" do
      get 'index', :ref => @img.image_ref, :user => @img.user.id
      response.should be_success
      response.should render_template('show/index')
      response.request.params[:format].should == 'android'
    end
  end
end
