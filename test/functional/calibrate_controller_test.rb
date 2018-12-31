require 'test_helper'

class CalibrateControllerTest < ActionController::TestCase
  test "should get start" do
    get :start
    assert_response :success
  end

  test "should get cal" do
    get :cal
    assert_response :success
  end

  test "should get save" do
    get :save
    assert_response :success
  end

  test "should get diam" do
    get :diam
    assert_response :success
  end

end
