class AddUploadUrlToImages < ActiveRecord::Migration
  def self.up
    add_column :images, :upload_url, :string
  end

  def self.down
    remove_column :images, :upload_url
  end
end
