class UserProduct < ActiveRecord::Base
  has_and_belongs_to_many :images
  # todo: add unique validation on user_id and user_product_id

  # returns the UserProduct for a given user and product name/id. Creates one if it doesn't exist yet
  def self.find_or_create_user_product(user_id, product_id)
    self.where(:user_id => user_id, :user_product_id => product_id).first_or_create
  end

  # returns all images for a given user and product
  def self.find_images(user_id, product)
    up = self.includes(:images).where(:user_id => user_id, :user_product_id => product).first
    return up ? up.images(true) : nil
  end
end
