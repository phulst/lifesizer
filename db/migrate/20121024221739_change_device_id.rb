class ChangeDeviceId < ActiveRecord::Migration
  def up
    change_column :devices, :device_id, :string

    Device.all.each do |dev|
      dev.update_attributes(:device_id => dev.make_device_id)
    end
    # do a change column again and set null constraint
    change_column :devices, :device_id, :string, :null => false
    add_index :devices, :device_id, :name => 'unique_device_id', :unique => true
  end

  def down
    remove_index :devices, :name => 'unique_device_id'
    change_column :devices, :device_id, :integer
  end
end
