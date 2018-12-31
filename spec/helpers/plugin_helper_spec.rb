require 'spec_helper'

describe PluginHelper do
  include Devise::TestHelpers

  before :each do
    @user = create :user

    @read_key = create :api_key_read
    @write_key = create :api_key_write

    sign_in @user
  end

  context "public api key" do

    it "should return key if present" do
      @read_key = create :api_key_read, :user => @user
      helper.api_key.should == @read_key.key
    end

    it "should return nil if not present" do
      helper.api_key.should be_nil
    end
  end

  context "secret api key" do

    it "should return secret key if present" do
      @secret_key = create :api_key_write, :user => @user
      helper.secret_key.should == @write_key.key
    end

    it "should return nil if no secret key present" do
      helper.secret_key.should be_nil
    end
  end
end
