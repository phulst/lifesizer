class RenameUrlInImages < ActiveRecord::Migration
  def self.up
    rename_column :images, :url, :original_url
    remove_column :images, :remote_upload_url
  end

  def self.down
    rename_column :images, :original_url, :url
    add_column :images, :remote_upload_url
  end
end
