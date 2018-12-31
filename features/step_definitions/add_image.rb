
When /^I enter a test image URL$/ do
  fill_in 'image_remote_upload_url' , :with => test_image_url
end
