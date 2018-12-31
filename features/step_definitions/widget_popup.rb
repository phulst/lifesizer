
When /^I click on the embed link for my (\d+)(st|nd|rd|th) image$/ do |img_num, x|
  n = img_num.to_i - 1

  # couldn't find a working css or xpath selector for nth match
  p page.all(".buttons .embed-link")[n].click
end

Then /^a popup window with name '(.*)' should open$/ do |name|
  page.driver.browser.switch_to.window(name)
end

Then /there should be an embed code in the input field/ do
  # the 'value' attribute of the text input field should contain something with 'iframe'
  page.should have_xpath "//input[@type = 'text'][contains(@value, 'iframe')]"
end
