class AddTypeToApiKeys < ActiveRecord::Migration
  def self.up
    add_column :api_keys, :access_type, :integer
  end

  def self.down
    remove_column :api_keys, :access_type
  end
end
