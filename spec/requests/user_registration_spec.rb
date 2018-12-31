require "spec_helper"

describe "user registration" do
  include Capybara::DSL

  it "stores plan number on registration" do
    visit "/users/sign_up?plan=4"

    fill_in "Email",                 :with => "phulst@sbcglobal.net"
    fill_in "user_password",         :with => "ilovegrapes"
    fill_in "Password confirmation", :with => "ilovegrapes"

    click_button "sign_up"

    page.should have_content("Thanks for signing up")
  end
end