Feature: Registration Page
  In order to be able to be use LifeSizer
  As an unregistered user
  I want to be able to sign up for a LifeSizer account

  Scenario: Registration
    Given I am a first time visitor
    When I go to the registration page
    And I enter 'test5@lifesizer.com' for Email
    And I enter '7890uiop' for user_password
    And I enter '7890uiop' for user_password_confirmation
    And I click on the 'sign up' button
    Then I should see the registration confirmation page
    And I should be logged in as test5@lifesizer.com

# todo: add scenario for failing registration

# todo: add scenarios for social sign-in