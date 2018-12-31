class AddImageRefCountToUser < ActiveRecord::Migration
  def self.up
    add_column :users, :image_ref_count, :integer, :default => 0
    User.reset_column_information
    User.find(:all).each do |u|
      u.update_attribute(:image_ref_count, 0)
    end
  end

  def self.down
    remove_column :users, :image_ref_count
  end
end
