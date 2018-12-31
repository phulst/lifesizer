require 'spec_helper'

describe ApiKey do

  before(:each) do
    @read_key = create :api_key_read
    @write_key = create :api_key_write
    @disabled_key = create :api_key_disabled
  end

  context "read access" do
    it "should be allowed for matching key" do
      key = ApiKey.check_valid_key_for_read(@read_key.key)
      key.should == @read_key
    end

    it "should be allowed for write key" do
      key = ApiKey.check_valid_key_for_read(@write_key.key)
      key.should == @write_key
    end

    it "should not be allowed for disabled key" do
      key = ApiKey.check_valid_key_for_read(@disabled_key.key)
      key.should be_nil
    end
  end

  context "write access" do
    it "should be allowed for matching key" do
      key = ApiKey.check_valid_key_for_write(@write_key.key)
      key.should == @write_key
    end

    it "should not be allowed for read key" do
      key = ApiKey.check_valid_key_for_write(@read_key.key)
      key.should be_nil
    end

    it "should not be allowed for disabled key" do
      key = ApiKey.check_valid_key_for_write(@disabled_key.key)
      key.should be_nil
    end
  end

  context "find" do
    it "should return write key for user" do
      key = ApiKey.find_write_key(@write_key.user)
      key.should == @write_key
    end
  end

  context "generation" do
    it "should generate read key" do
      user = create :user
      key = ApiKey.generate(user, 'myhost.com')
      key.key.should match(/^[a-f0-9]{16}$/)
      key.hostname.should == 'myhost.com'
      key.user.should == user
      key.access_type.should == ApiKey::ACCESS_TYPE_READ
      ApiKey.check_valid_key_for_read(key.key).should be_true
      ApiKey.check_valid_key_for_write(key.key).should be_false # shouldn't be able to write with this key
    end

    it "should generate write key" do
      user = create :user
      key = ApiKey.generate(user, 'myhost.com', ApiKey::ACCESS_TYPE_WRITE)
      key.key.should match(/^[a-f0-9]{16}$/)
      key.hostname.should == 'myhost.com'
      key.user.should == user
      key.access_type.should == ApiKey::ACCESS_TYPE_WRITE
      ApiKey.check_valid_key_for_read(key.key).should be_true
      ApiKey.check_valid_key_for_write(key.key).should be_true
    end
  end
end