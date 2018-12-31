Feature: Recent Images Page
  In order to be able to see what's new
  As a website visitor
  I want to be able to view the list of recent images

  Scenario: First visit
    Given I am a first time visitor
    And there are 15 images
    When I go to the recent images page
    Then I should see the title 'Recently added images'
    And I should see 15 images
