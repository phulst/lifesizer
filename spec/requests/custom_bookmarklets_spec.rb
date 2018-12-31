require 'spec_helper'

describe "CustomBookmarklets" do

  # this now requires a valid login. need to update. Unfortunately login_user and login_admin macros
  # won't work in request specs so will probably have to actually submit login request
  # http://stackoverflow.com/questions/5787409/stubbing-authentication-in-request-spec/5803121#5803121
  pending "GET /custom_bookmarklets" do
    it "works! (now write some real specs)" do
      # Run the generator again with the --webrat flag if you want to use webrat methods/matchers
      get custom_bookmarklets_path
      response.status.should be(200)
    end
  end
end
