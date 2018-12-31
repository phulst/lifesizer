class AddUserProducts < ActiveRecord::Migration
  def self.up
    create_table :images_user_products do |t|
      t.references  :image, :null => false
      t.references  :user_product, :null => false
    end

    create_table :user_products do |t|
      t.references  :user, :null => false
      t.string      :user_product_id, :null => false
      t.timestamps
    end
    add_index :user_products, :user_product_id, :unique => true
  end

  def self.down
    drop_table :user_products
    drop_table :images_user_products
  end
end
