class AddSocialDataToUsers < ActiveRecord::Migration
  def change
    add_column :users, :image_url, :string
    add_column :users, :provider_username, :string
    add_column :users, :provider_profile_url, :string
  end
end
