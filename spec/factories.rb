# Factory definitions
# http://rubydoc.info/gems/factory_girl/1.3.3/frames
FactoryGirl.define do

  factory :user do
    sequence(:email) {|n| "peter#{n}@lifesizer.com" }
    password "123456"

    factory :admin do
      admin   true
    end
  end

  factory :image do
    #i.remote_upload_url "http://www.letsgodigital.org/images/artikelen/38/panasonic-dmc-lx5.jpg"
    original_url      "http://www.letsgodigital.org/images/artikelen/38/panasonic-dmc-lx5.jpg"
    upload            { File.open(File.join(Rails.root, 'test', 'data', 'images', 'lx5.jpg')) }
    width             530
    height            434
    ppi               100
    name              'panasonic lx5'
    sequence(:ref) {|n| "lx5_#{n}" }
    calibrate_coords  "38,266-489,265"
    calibrate_unit    1
    calibrate_length  4.3
    image_type        Image::TYPE_LS
    page_url          'http://coolsite/coolimage.jpg'
    #i.auto_ref          "210"
    #i.upload            "c440165b6d65.jpg"
    #i.medium_width      280
    #i.medium_height     224
    association       :user

    factory :featured_image do
      featured true
    end

    factory :lx5_image do
      ref           'lx5'
    end
  end

  # test api_key for read
  factory :api_key_read, :class => ApiKey do
    key           "112233445566"
    access_type   ApiKey::ACCESS_TYPE_READ
    association   :user
  end
  # api_key for save
  factory :api_key_write, :class => ApiKey do
    key           "223344556677"
    access_type     ApiKey::ACCESS_TYPE_WRITE
    association   :user
  end
  # disabled api_key
  factory :api_key_disabled, :class => ApiKey do
    key           "334455667788"
    access_type   ApiKey::ACCESS_TYPE_DISABLED
    association   :user
  end

  factory :device do
    vendor        "Apple"
    model         "ipad"
    device_id     "Apple ipad"
    device_name   "Apple ipad Retina"
    device_pixel_ratio  2.0
    display_size  9.0
    resolution_x  1536
    resolution_y  2048
  end

  #factory :account_option do
  #  association       :user
  #  bookmarklet true
  #  bookmarklet_options 1
  #end
end
