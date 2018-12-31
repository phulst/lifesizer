require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe User do

  context 'create' do

    it "should create an account_option association" do
      @user = create :user
      @user.account_option.should_not be nil
    end

  end

  context "updates" do

    it "should update image_ref_counter" do
      @user = create :user

      lambda {
        @user.next_auto_ref
        @user.next_auto_ref
      }.should change(@user, :image_ref_count).by(2)
    end
  end
end