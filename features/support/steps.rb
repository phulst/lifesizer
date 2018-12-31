Given /^I am a first time visitor$/ do
  # no need to do anything
end

Given /^there are (\d+) images$/ do |num|
  FactoryGirl.create_list(:image, num.to_i)
end

Given /^I have (\d+) images?$/ do |num|
  FactoryGirl.create_list(:image, num.to_i, :user => @user)
end

When /^I go to (.+)$/ do |page_name|
  visit path_to(page_name)
end

When /^I click on the '(.*)' button$/ do |button|
  click_button button
end

Then /^I should see the title '(.*)'$/ do |title|
  page.should have_selector('h2', :text => title)
end

Then /^it should show a (h\d) header with text '(.*)'$/ do |header, text|
  page.should have_selector(header, :text => text)
end

Then /^I should see (\d+) images$/ do |num|
  page.should have_selector('div.ls_item', :count => num.to_i)
end

Then /^I should see the (.+) page$/ do |page_name|
  current_path.should == path_to(page_name)
end
# same as above
Then /^I should be redirected to the (.+) page$/ do |page_name|
  current_path.should == path_to(page_name)
end

# tests that a text link is or isn't present
Then /^I should (not )?see the '(.*)' link$/ do |n, link_text|
  h = have_selector('li a', :text => link_text)
  n == 'not ' ? page.should_not(h) : page.should(h)
end

When /^I enter '(.*)' for (.*)$/ do |str, field|
  fill_in field, :with => str
end

Given /^I am logged in$/ do
  create_user
  sign_in
end

Then /^I should be logged in as (.*)$/ do |user|
  page.should have_selector('#header .panel', :text => "welcome #{user}")
end

def sign_in
  visit '/users/sign_in'
  fill_in "user_email", :with => @visitor[:email]
  fill_in "user_password", :with => @visitor[:password]
  click_button "sign in"
end

def create_user
  create_visitor
  delete_user
  @user = FactoryGirl.create(:user, @visitor)
end

def create_visitor
  @visitor ||= { :name => "Peter Hulst", :email => "cucumber@lifesizer.com",
    :password => "password", :password_confirmation => "password" }
end

def delete_user
  @user ||= User.where(:email => @visitor[:email]).first
  @user.destroy unless @user.nil?
end

# returns an image url for which the request has been mocked, so no actual http
# request will be made.
def test_image_url
  if !@test_image_url
    # mock the http request for this url
    @test_image_url = "http://www.lifesizer.com/myimage.jpg"
    stub_http_request(:get, @test_image_url).to_return(
        :body => File.new('test/data/images/scissors.jpg'), :status => 200)
  end
  @test_image_url
end
