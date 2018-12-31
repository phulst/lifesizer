class UpdateAccountOptions < ActiveRecord::Migration
  def up
    add_column :account_options, :keep_cache, :boolean, :default => false
    add_column :account_options, :default_private, :boolean, :default => false

    # create account options that aren't there yet
    ok = 0
    User.all.each do |user|
      if !user.account_option
        AccountOption.create!(:user => user, :keep_cache => true)
        puts "user #{user.email} didn't have account option yet"
      else
        user.account_option.update_attributes!(:keep_cache => true)
        ok += 1
      end
    end
    puts "#{ok} users were already ok"
  end

  def down
    remove_column :account_options, :keep_cache
    remove_column :account_options, :default_private
  end
end
