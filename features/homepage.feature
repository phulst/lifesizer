Feature: Homepage
  In order to do business
  As a website visitor
  I want to be able to view the home page

  Scenario: First visit
    Given I am a first time visitor
    And there are 20 featured images
    When I go to the home page
    Then I should see the title 'Featured LifeSize images'
    And I should see 20 images
