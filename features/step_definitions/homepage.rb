
Given /^there are (\d+) featured images$/ do |num|
  FactoryGirl.create_list(:featured_image, num.to_i)
end

