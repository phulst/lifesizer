class CreateDemoUser < ActiveRecord::Migration
  def self.up
    u = User.find_by_email('demoacc@lifesizer.com')
    if !u
      u = User.create!({:email => "demoacc@lifesizer.com", :password => "demo_password", :password_confirmation => "demo_password" })
    end
  end

  def self.down
  end
end
