
Given /^There are (\d+) images owned by others$/ do |num|
  # create num images owned by a different user
  someone_else = FactoryGirl.create(:user)
  FactoryGirl.create_list(:image, num.to_i, :user => someone_else)
end

When /^I visit the user images page$/ do
  visit images_user_path
end
