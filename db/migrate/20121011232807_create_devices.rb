class CreateDevices < ActiveRecord::Migration
  def up
    create_table :devices do |t|
      t.string  :vendor
      t.string  :model
      t.string  :device_name  # if different from vendor + model
      t.integer :device_id
      t.float   :ppi
      t.float   :device_pixel_ratio, :default => 1.0
      t.float   :display_size
      t.integer :resolution_x
      t.integer :resolution_y
      t.boolean :reviewed, :default => false

      t.timestamps
    end
  end

  def down
    drop_table :devices
  end
end
