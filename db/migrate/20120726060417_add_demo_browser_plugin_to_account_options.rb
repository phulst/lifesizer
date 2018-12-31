class AddDemoBrowserPluginToAccountOptions < ActiveRecord::Migration
  def change
    add_column :account_options, :demo_browser_plugin, :boolean
    add_column :account_options, :demo_browser_plugin_options, :integer
  end
end
