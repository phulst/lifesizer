class FixUserProductsIndex < ActiveRecord::Migration
  def up
    remove_index :user_products, :column => :user_product_id
    add_index :user_products, [:user_product_id, :user_id], :name => 'unique_product_id', :unique => true
  end

  def down
    remove_index :user_products, :name => 'unique_product_id'
    # don't put the old index back - it wasn't working properly anyway
  end
end