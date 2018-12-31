class RenameDeviceReviewed < ActiveRecord::Migration
  def change
    rename_column :devices, :reviewed, :verified
  end
end
