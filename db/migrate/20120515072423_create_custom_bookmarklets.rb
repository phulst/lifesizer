class CreateCustomBookmarklets < ActiveRecord::Migration
  def self.up
    create_table :custom_bookmarklets do |t|
      t.text :script

      t.timestamps
    end
  end

  def self.down
    drop_table :custom_bookmarklets
  end
end
