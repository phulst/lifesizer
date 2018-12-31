require 'spec_helper'

describe AdminController do

  describe "GET 'index'" do
    login_admin
    
    it "should be successful" do
      get 'index'
      response.should be_success
    end
  end

end
