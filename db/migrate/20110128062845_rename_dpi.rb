class RenameDpi < ActiveRecord::Migration
  def self.up
    rename_column :images, :dpi, :ppi
  end

  def self.down
    rename_column :images, :ppi, :dpi
  end
end
