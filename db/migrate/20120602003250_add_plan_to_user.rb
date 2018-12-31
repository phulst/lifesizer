class AddPlanToUser < ActiveRecord::Migration
  def self.up
    add_column :users, :plan, :integer
  end

  def self.down
    remove_column :users, :plan
  end
end
