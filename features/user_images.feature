Feature: User Images Page
  In order to be able to manage images
  As a registered user
  I want to be able to view a list of my images

  Scenario: View User Images
    Given I am logged in
    And I have 10 images
    And There are 5 images owned by others
    When I go to the user images page
    Then I should see 10 images
