class AddDeviceType < ActiveRecord::Migration
  def up
    add_column :devices, :device_type, :string
  end

  def down
    remove_column :devices, :device_type
  end
end
