require 'spec_helper'

describe TestController do

  describe "GET 'cookies'" do
    it "should be successful" do
      get :show_cookies
      response.should be_success
    end
  end

end
