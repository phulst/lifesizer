class AddMediumDimensionsToImages < ActiveRecord::Migration
  def self.up
    add_column :images, :medium_width, :integer
    add_column :images, :medium_height, :integer
  end

  def self.down
    remove_column :images, :medium_height
    remove_column :images, :medium_width
  end
end
