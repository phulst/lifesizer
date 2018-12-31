class MigrateImages < ActiveRecord::Migration
  def up
    add_column :images, :old_filename, :string
  end

  def down
    remove_column :images, :old_filename
  end
end
