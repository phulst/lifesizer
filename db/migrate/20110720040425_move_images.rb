require 'fileutils'

class MoveImages < ActiveRecord::Migration
  # run this without the ImageUploader messing with things
  class Image < ActiveRecord::Base; end

  def self.up
  end

  def self.up_old
    public_dir = "/var/app/lifesizer/shared/content"
    # public_dir = File.join(File.dirname(__FILE__), "../../public" )

    upload_base_dir = "#{public_dir}/uploads/ls_img/0"
    if !File.directory?(upload_base_dir)
      Dir.mkdir(upload_base_dir)
    end

    images = Image.find(:all)
    images.each do |img|
      if img.upload.nil?
        hsh = ActiveSupport::SecureRandom.hex(6)
        img.update_attributes(:upload => "#{hsh}.jpg")
        old_path = "#{public_dir}/thumbnails/#{img.user_id}/#{img.id}.thmb.jpg"
        user_upload = "#{upload_base_dir}/#{img.user_id}"
        if !File.directory?(user_upload)
          puts "creating dir #{user_upload}"
          Dir.mkdir(user_upload)
        end

        new_path = "#{public_dir}/uploads/ls_img/0/#{img.user_id}/thumb_#{img.upload}"
        puts "moving #{old_path} to #{new_path}"
        begin
          FileUtils.mv(old_path, new_path)
        rescue
          puts "couldn't move #{old_path}"
        end
      end
    end
  end

  def self.down
    # too hard
    raise ActiveRecord::IrreversibleMigration
  end
end
