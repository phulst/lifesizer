class AddUploadToImages < ActiveRecord::Migration
  def self.up
    add_column :images, :upload, :string
  end

  def self.down
    remove_column :images, :upload
  end
end
