require 'test_helper'

#require File.dirname(__FILE__) + '/test_helper'

#require "test/unit"

class ImageToolTest < ActiveSupport::TestCase
#class ImageToolTest < Test::Unit::TestCase

  # Called before every test method runs. Can be used
  # to set up fixture information.
  def setup
    @image_tool = ImageTool.new
  end

  # Called after every test method runs. Can be used to tear
  # down fixture information.

  def teardown
    # Do nothing
  end

  # tests that if you call temp_filename 3 times, you get 3 different temp filenames
  def test_temp_filename
    names = {}
    10.times do
      filename = @image_tool.temp_filename
      puts filename
      names[filename] = true
      # expect a filename like /4902da2167057691.jpg
      assert_match /^\/[0-9a-f]{16}\.jpg$/, filename, "filename has unexpected pattern"
    end
    assert_equal(10, names.length, "not 10 unique temp filenames")
  end

  test "should retrieve image" do
    image_url = "http://farm5.static.flickr.com/4133/5012476993_8e0b0ef282.jpg"

    filename = @image_tool.retrieve_image(image_url)
    assert_not_nil filename

    # check that the filename matches what we'd expect
    assert (filename.index(TMP_DIR) == 0)
    assert_match(/(.jpg)$/, filename)
    # check that file is readable with expected size
    assert(File.readable? filename)
    assert_equal(166572, File.size(filename) )
    # ok, all good, now remove the file again
    File.delete(filename)
  end

  test "should fetch and resize ok" do
    image_url = "http://farm5.static.flickr.com/4133/5012476993_8e0b0ef282.jpg"

    data = @image_tool.fetch_and_make_thumbnail
  end


end