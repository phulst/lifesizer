class RenameUploadUrlToUpload < ActiveRecord::Migration
  def self.up
    rename_column :images, :upload_url, :upload
  end

  def self.down
    rename_column :images, :upload, :upload_url
  end
end
