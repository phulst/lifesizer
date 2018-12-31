# this observer handles updating the Cloud files cache for the current user, if necessary
class ImageObserver < ActiveRecord::Observer

  #callback for save/update image
  def after_save(image)
    update_image_cache(image)
  end

  # callback for delete image
  def after_destroy(image)
    update_image_cache(image)
  end

  def update_image_cache(image)
    # if keep_cache option is set to false, we don't persist anything to CDN
    return if !image.user.account_option.keep_cache?

    valid_key = false
    image.user.api_keys.each do |key|
      if (key.access_type == ApiKey::ACCESS_TYPE_READ || key.access_type.nil?)
        Rails.logger.info("storing image cache for #{image.user.email} to CloudFiles")
        cc = CloudCache.new
        # use delayed_job to do this in the background
        cc.delay.save_user_cache(key.key)
        break
      end
    end
  end
end
