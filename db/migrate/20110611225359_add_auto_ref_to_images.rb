class AddAutoRefToImages < ActiveRecord::Migration
  def self.up
    add_column :images, :auto_ref, :boolean
  end

  def self.down
    remove_column :images, :auto_ref
  end
end
