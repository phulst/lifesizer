class RenameFilename < ActiveRecord::Migration
  def self.up
    rename_column :images, :filename, :remote_upload_url
  end

  def self.down
    rename_column :images, :remote_upload_url, :filename
  end
end
