require 'spec_helper'

describe ImageObserver do

  before(:each) do
    @observer = ImageObserver.instance
    @image = create :lx5_image
    @image.user.account_option.keep_cache = true
  end

  context "after_save" do
    it "should receive callback" do
      @observer.expects(:after_save).with(@image).once
      @image.save!
    end

    it "should update cloud files" do
      @observer.expects(:update_image_cache).with(@image).once
      @image.save!
    end
  end

  context "after_update" do
    it "should receive callback" do
      @observer.expects(:after_save).with(@image).twice
      @image.save!
      @image.update_attributes(:name => "blah")
    end

    it "should update cloud files" do
      @observer.expects(:update_image_cache).with(@image).twice
      @image.save!
      @image.update_attributes(:name => "blah")
    end
  end

  context "after destroy" do
    it "should receive callback" do
      @image.save!
      @observer.expects(:after_destroy).with(@image).once
      @image.destroy
    end

    it "should update cloud files" do
      @image.save!
      @observer.expects(:update_image_cache).with(@image)
      @image.destroy
    end
  end

  context "update image cache" do
    it "should happen if user has read key" do
      api_key = create(:api_key_read)
      @image.user.api_keys << api_key

      delay = mock()
      delay.expects(:save_user_cache).with(api_key.key)
      CloudCache.any_instance.stubs(:delay).returns(delay)

      @observer.update_image_cache(@image)
    end

    it "should not happen if user doesn't have read key" do
      api_key = create(:api_key_write)
      @image.user.api_keys << api_key

      delay = mock()
      delay.expects(:save_user_cache).with(api_key.key).never
      CloudCache.any_instance.stubs(:delay).returns(delay)

      @observer.update_image_cache(@image)
    end

    it "should not happen if user doesn't have keep_cache enabled" do
      api_key = create(:api_key_read)
      @image.user.api_keys << api_key
      @image.user.account_option.keep_cache = false

      delay = mock()
      delay.expects(:save_user_cache).with(api_key.key).never
      CloudCache.any_instance.stubs(:delay).returns(delay)

      @observer.update_image_cache(@image)
    end
  end
end