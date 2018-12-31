class AddPageUrlToImages < ActiveRecord::Migration
  def self.up
    add_column :images, :page_url, :string
  end

  def self.down
    remove_column :images, :page_url
  end
end