class AddBrowserPluginToAccountOptions < ActiveRecord::Migration
  def change
    add_column :account_options, :browser_plugin, :boolean
    add_column :account_options, :browser_plugin_options, :integer
  end
end
