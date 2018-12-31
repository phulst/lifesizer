# this class can - under certain circumstances - automatically add unknown images
# to the index. This contains logic very specific to certain customers.

class UnknownImageHandler

  # attempts to create an image.
  # @return Image if one could be created, otherwise nil
  def attempt_create_image(user_id, app_key, ref)
    cust = find_customer(user_id, app_key)
    return create_image(cust, ref, user_id) if cust
    nil
  end

  # find customer handler for current user and appkey
  def find_customer(user_id, app_key)
    user_id = user_id.to_i
    if (user_id == EeBeads::USER_ID && app_key == EeBeads::APP_KEY)
      EeBeads.new
    end
    # else... check for other customer account matches
  end

  # creates a new Image object and stores this in the database
  def create_image(handler, ref, user_id)
    Image.create do |img|
      img.original_url = handler.url(ref)
      img.remote_upload_url = img.original_url
      img.ppi = handler.ppi(ref)
      img.user_id = user_id
      img.ref = ref
      img.image_type = Image::TYPE_LS
      # set by devise functionality: width, height, upload, medium_width, medium_height
    end
  end

  # CUSTOMER SPECIFIC CODE BELOW. BREAK THIS OUT INTO SEPARATE CLASSES WHEN THIS GETS MORE COMPLEX

  #
  # EeBeads specific code
  #
  class EeBeads
    USER_ID = 509
    APP_KEY = "8fe39f1d7de33f22"

    # returns the image url given the image ref
    def url(ref)
      "http://www.eebeads.com/Pix/#{ref}L.jpg"
    end

    # returns the ppi for the image given the ref. This is easy because almost all eebeads
    # images are 300dpi
    def ppi(ref)
      300
    end
  end
end
