class CreateAccountOptions < ActiveRecord::Migration
  def self.up
    create_table :account_options do |t|
      t.integer :user_id
      t.integer :account_type
      t.integer :max_images
      t.boolean :bookmarklet
      t.integer :bookmarklet_options
      t.boolean :ssl
      t.timestamps
    end
  end

  def self.down
    drop_table :account_options
  end
end
