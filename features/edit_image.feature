Feature: Edit Image Page
  In order to manage my LifeSizer images
  As a registered user
  I should be able to change properties and recalibrate my images

  Scenario: Edit LifeSize Image
    Given I am logged in
    And I have 1 image
    And I visit the edit image page for my image