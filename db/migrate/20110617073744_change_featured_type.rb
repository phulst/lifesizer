class ChangeFeaturedType < ActiveRecord::Migration
  def self.up
    remove_column :images, :featured
    add_column :images, :featured, :integer
  end

  def self.down
    raise ActiveRecord::IrreversibleMigration
  end
end
