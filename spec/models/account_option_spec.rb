require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe AccountOption do

  before(:each) do
    @user = create :user
  end

  it "should return account options for user" do
    @user.account_option.should_not be_nil
  end
end