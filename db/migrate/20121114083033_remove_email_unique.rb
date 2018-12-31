class RemoveEmailUnique < ActiveRecord::Migration
  def up
    #remove unique index on email.
    remove_index :users, :email
    remove_column :users, :username
  end

  def down
    add_index :users, :email, :unique => true
    add_column :users, :username, :string
  end
end
