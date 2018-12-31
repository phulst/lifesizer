require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe ImageUploader do
  before(:each) do
    @uploader = ImageUploader.new
  end

  # uses mock to verify that it can call imagemagick to determine dimensions of a test image
  it "should be able to resize images" do
    test_image = File.new(File.join(File.dirname(__FILE__), "/../../test/data/images/thumb_scissors.jpg" ))

    model = mock(:width= => "150", :height= => "124")
    @uploader.expects(:model).returns(model).at_least(2)
    @uploader.capture_size_before_cache(test_image)
  end
end