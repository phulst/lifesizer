Feature: Add Image Pages
  In order to be able to share LifeSize images
  As a registered user
  I should be able to add and calibrate an image on the site

  Scenario: Add LifeSize Image
    Given I am logged in
    When I go to the add image page
    And I enter a test image URL
    And I click on the 'next' button
    Then I should see the title 'Calibrate your image'