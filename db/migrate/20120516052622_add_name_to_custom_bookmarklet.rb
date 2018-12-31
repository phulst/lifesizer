class AddNameToCustomBookmarklet < ActiveRecord::Migration
  def self.up
    add_column :custom_bookmarklets, :name, :string
  end

  def self.down
    remove_column :custom_bookmarklets, :name
  end
end
