class AddGuidToImage < ActiveRecord::Migration
  def up
    change_table :images do |i|
      i.string :guid, :unique => true
      i.index :guid
    end

    # set the guid for all already existing images
    Image.where(:guid => nil).each do |i|
      i.update_attributes(:guid => ActiveSupport::SecureRandom.hex(8))
    end
  end

  def down
    remove_index :images, :guid
    remove_column :images, :guid
  end
end
