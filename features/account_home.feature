Feature: Account Homepage
  In order to be able to use LifeSizer
  As an registered user
  I want to see my stuff on the account home page

  Scenario: Account Home Page no access
    Given I am a first time visitor
    When I go to the account home page
    Then I should be redirected to the sign in page

  Scenario: Account Home Page
    Given I am logged in
    When I go to the account home page
    Then I should see the title 'Welcome!'
    And I should not see the 'Bookmark installation instructions' link

# todo:account home page for user with bookmarklet
