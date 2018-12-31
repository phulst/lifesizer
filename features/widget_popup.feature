@javascript

Feature: User Images Page
  In order to be able to embed images on my site
  As a registered user
  I want to be able to get the embed code for any of my images

  Scenario: Get image embed code
    Given I am logged in
    And I have 1 image
    When I go to the user images page
    And I click on the embed link for my 1st image
    Then a popup window with name 'lifesize' should open
    And it should show a h4 header with text 'This is your LifeSizer widget'
    And there should be an embed code in the input field
# TODO: test that I'm looking at the correct image