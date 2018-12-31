class AddFeaturedToImages < ActiveRecord::Migration
  def self.up
    add_column :images, :featured, :boolean
  end

  def self.down
    remove_column :images, :featured
  end
end
