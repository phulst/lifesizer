require "test_helper"

# tests the utilities module
class UtilsTest < ActiveSupport::TestCase

  def setup
    # Do nothing
  end

  def teardown
    # Do nothing
  end

  # tests the unique hash function
  test "unique hash" do
    hashes = {}
    100.times do
      h = Utils.unique_hash
      assert_equal(16, h.length, "unexpected length")
      hashes[h] = true
    end
    # if all hashes were unique, we should now have 100 of them
    assert_equal(100, hashes.length)
  end

end