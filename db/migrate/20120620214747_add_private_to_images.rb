class AddPrivateToImages < ActiveRecord::Migration
  def up
    change_table :images do |i|
      i.boolean :private, :default => false
      i.index :private
      i.index :user_id
      i.index :image_type
      i.index :ref
    end
    Image.update_all ["private = ?", false]
  end

  def down
    remove_index :images, :private
    remove_index :images, :user_id
    remove_index :images, :ref
    remove_column :images, :private
  end
end
