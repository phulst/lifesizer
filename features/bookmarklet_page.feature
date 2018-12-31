Feature: Bookmarklet Page
  In order to be able to use the LifeSizer bookmarklet
  As an registered user
  I want to see the bookmarklet page

  Scenario: Bookmarklet page
    Given I am logged in
    And I have a custom bookmarklet
    When I go to the bookmarklet page
