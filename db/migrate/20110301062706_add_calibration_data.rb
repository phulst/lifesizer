class AddCalibrationData < ActiveRecord::Migration
  def self.up
    add_column :images, :calibrate_coords,  :string
    add_column :images, :calibrate_unit,    :integer
    add_column :images, :calibrate_length,  :float
  end

  def self.down
    remove_column :images, :calibrate_coords
    remove_column :images, :calibrate_unit
    remove_column :images, :calibrate_length
  end
end
