require 'active_record/fixtures'

class LoadTestImages < ActiveRecord::Migration
  def self.up
    down
    directory = File.join(File.dirname(__FILE__), "prod_data")
    Fixtures.create_fixtures(directory, "images")
  end

  def self.down
    Image.delete_all("image_type = 2")
  end
end
