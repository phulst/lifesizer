class RenameUploadToFile < ActiveRecord::Migration
  def self.up
    rename_column :images, :upload, :filename
    add_column :images, :remote_upload_url, :string, :limit => 1000
  end

  def self.down
    rename_column :images, :filename, :upload
    remove_column :images, :remote_upload_url, :string
  end
end
