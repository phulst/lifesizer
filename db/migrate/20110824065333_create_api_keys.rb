class CreateApiKeys < ActiveRecord::Migration
  def self.up
    create_table :api_keys do |t|
      t.string :key
      t.string :hostname
      t.references :user

      t.timestamps
    end
  end

  def self.down
    drop_table :api_keys
  end
end
