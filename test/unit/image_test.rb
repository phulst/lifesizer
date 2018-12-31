require 'test_helper'

class ImageTest < ActiveSupport::TestCase
  fixtures :images

  # Replace this with your real tests.
  test "images atributes must not be empty" do
    image = Image.new
    # images will be invalid if url, width, height or image_type aren't set
    assert image.invalid?
    assert image.errors[:url].any?
    assert image.errors[:width].any?
    assert image.errors[:height].any?
    assert image.errors[:image_type].any?

  end

  test "lx3 images exists" do
    image = images(:lx3)
    assert_not_nil image
    assert_equal "Panasonic DMC-LX3", image.name
  end
end
