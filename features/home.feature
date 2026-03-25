@smoke
Feature: Practice Software Testing website scenarios

  Scenario: Search for a product from the home page
    Given the user is on the home page
    When the user enters "Pliers" in the search field
    And the user starts the search
    Then the product list should be updated
    And the results should show products related to "Pliers"

  Scenario: Filter products by category
    Given the user is on the home page
    When the user opens the category filters
    And the user selects a category
    Then the product list should be updated
    And only products from the selected category should be shown

  Scenario: Filter products by brand
    Given the user is on the home page
    When the user opens the brand filters
    And the user selects a brand
    Then the product list should be updated
    And only products from the selected brand should be shown

  Scenario: Filter products by price range
    Given the user is on the home page
    When the user adjusts the price range filter
    And the user applies a lower and upper price limit
    Then the product list should be updated
    And the shown products should match the selected price range

  Scenario: Sort products on the listing page
    Given the user is on the home page
    When the user opens the sort dropdown
    And the user selects a sorting option
    Then the product list should be updated
    And the products should be displayed in the selected order

  Scenario: Open a product details page
    Given the user is on the home page
    When the user clicks on a product from the list
    Then the product details page should open
    And the product name should be visible
    And the product price should be visible

  Scenario: Change quantity and add a product to the cart
    Given the user is on a product details page
    When the user changes the quantity
    And the user clicks "Add to cart"
    Then the product should be added to the cart
    And the cart should reflect the selected quantity

  Scenario: Open a related product from a product page
    Given the user is on a product details page
    When the user scrolls to the related products section
    And the user clicks "More information" on a related product
    Then a new product details page should open
    And the selected related product name should be visible