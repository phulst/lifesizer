class MakeAutoRefString < ActiveRecord::Migration
  def self.up
    change_column :images, :auto_ref, :string
  end

  def self.down
    raise ActiveRecord::IrreversibleMigration
  end
end
