class AddCustomBookmarkletIdToAccountOption < ActiveRecord::Migration
  def self.up
    add_column :account_options, :custom_bookmarklet_id, :integer
  end

  def self.down
    remove_column :account_options, :custom_bookmarklet_id
  end
end
