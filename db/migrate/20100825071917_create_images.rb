class CreateImages < ActiveRecord::Migration
  def self.up
    create_table :images do |t|
      t.string :url
      t.string :ref
      t.integer :width
      t.integer :height
      t.float :dpi
      t.integer :image_type
      t.string :name
      t.text :description

      t.timestamps
    end
  end

  def self.down
    drop_table :images
  end
end
