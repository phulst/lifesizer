require 'spec_helper'

describe RegistrationsController do
  include Devise::TestHelpers

  describe "registration complete" do

    before(:each) do
      #@user = create(:user)  #:user from factory girl with admin privilages
      @request.env['devise.mapping'] = Devise.mappings[:user]
      #@user.confirm!
      #sign_in @user

      #@request.env["devise.mapping"] = Devise.mappings[:user]
    end

    pending "test registration 'complete' action"
  end

end
