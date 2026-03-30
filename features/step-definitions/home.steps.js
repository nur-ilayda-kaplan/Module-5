const { Given, Then, When } = require("@wdio/cucumber-framework");
const { assert, expect: chaiExpect } = require("../support/chai");
const homePage = require("../../pages/home.page");

const scenarioState = {
  listBeforeChange: "",
  selectedCategoryName: "",
  selectedCategoryDataTest: "",
  selectedBrandName: "",
  selectedBrandDataTest: "",
  selectedSortValue: "",
  selectedSortText: "",
  selectedMinPrice: 0,
  selectedMaxPrice: 0,
  selectedCartQuantity: 1,
  selectedRelatedProductName: "",
};

Given("the user is on the home page", async () => {
  await homePage.open();
  scenarioState.listBeforeChange = await homePage.getProductListSnapshot();
});

Given("the user is on a product details page", async () => {
  await homePage.open();
  await homePage.openFirstProductFromList();
});

When("the user enters {string} in the search field", async (searchText) => {
  await homePage.enterSearchText(searchText);
});

When("the user starts the search", async () => {
  await homePage.submitSearch();
});

Then("the product list should be updated", async () => {
  await homePage.waitForProductListToChange(scenarioState.listBeforeChange);
  scenarioState.listBeforeChange = await homePage.getProductListSnapshot();
});

Then(
  "the results should show products related to {string}",
  async (searchText) => {
    const visibleProductNames = await homePage.getVisibleProductNames();
    const searchTextLowerCase = searchText.toLowerCase();

    const allResultsMatch = visibleProductNames.every((name) =>
      name.toLowerCase().includes(searchTextLowerCase),
    );

    chaiExpect(visibleProductNames).to.have.length.greaterThan(0);
    chaiExpect(allResultsMatch).to.equal(true);
  },
);

When("the user opens the category filters", async () => {
  await homePage.waitForFiltersToBeVisible();
});

When("the user selects a category", async () => {
  const selectedCategory = await homePage.selectFirstCategory();
  scenarioState.selectedCategoryName = selectedCategory.name;
  scenarioState.selectedCategoryDataTest = selectedCategory.dataTest;
});

Then("only products from the selected category should be shown", async () => {
  const categoryIsApplied = await homePage.isFilterCheckedByDataTest(
    scenarioState.selectedCategoryDataTest,
  );

  assert.isTrue(
    categoryIsApplied,
    "The selected category filter should stay checked",
  );

  const productNames = await homePage.getVisibleProductNames();
  assert.isAbove(
    productNames.length,
    0,
    "At least one product should be visible after filtering by category",
  );
});

When("the user opens the brand filters", async () => {
  await homePage.waitForFiltersToBeVisible();
});

When("the user selects a brand", async () => {
  const selectedBrand = await homePage.selectFirstBrand();
  scenarioState.selectedBrandName = selectedBrand.name;
  scenarioState.selectedBrandDataTest = selectedBrand.dataTest;
});

Then("only products from the selected brand should be shown", async () => {
  const brandIsApplied = await homePage.isFilterCheckedByDataTest(
    scenarioState.selectedBrandDataTest,
  );
  const cardsMatchBrand = await homePage.doVisibleCardsContainBrand(
    scenarioState.selectedBrandName,
  );

  brandIsApplied.should.equal(true);
  cardsMatchBrand.should.equal(true);
});

When("the user adjusts the price range filter", async () => {
  await homePage.waitForFiltersToBeVisible();
});

When("the user applies a lower and upper price limit", async () => {
  const selectedRange = await homePage.applyPriceRangeFilter();

  scenarioState.selectedMinPrice = selectedRange.minPrice;
  scenarioState.selectedMaxPrice = selectedRange.maxPrice;
});

Then("the shown products should match the selected price range", async () => {
  const visiblePrices = await homePage.getVisibleProductPrices();
  const pricesMatchSelectedRange = visiblePrices.every(
    (price) =>
      price >= scenarioState.selectedMinPrice &&
      price <= scenarioState.selectedMaxPrice,
  );

  visiblePrices.length.should.be.greaterThan(0);
  pricesMatchSelectedRange.should.equal(true);
});

When("the user opens the sort dropdown", async () => {
  await homePage.waitForSortToBeVisible();
});

When("the user selects a sorting option", async () => {
  const selectedSort = await homePage.selectSortingOption();

  scenarioState.selectedSortValue = selectedSort.value;
  scenarioState.selectedSortText = selectedSort.text;
});

Then("the products should be displayed in the selected order", async () => {
  await homePage.assertProductsAreInSelectedOrder(
    scenarioState.selectedSortValue,
    scenarioState.selectedSortText,
  );
});

When("the user clicks on a product from the list", async () => {
  await homePage.openFirstProductFromList();
});

Then("the product details page should open", async () => {
  await homePage.waitForProductDetailPageToOpen();
});

Then("the product name should be visible", async () => {
  await expect(homePage.productDetailName).toBeDisplayed();
});

Then("the product price should be visible", async () => {
  await expect(homePage.productDetailPrice).toBeDisplayed();
});

When("the user changes the quantity", async () => {
  scenarioState.selectedCartQuantity = 3;
  await homePage.setProductQuantity(scenarioState.selectedCartQuantity);
});

When('the user clicks "Add to cart"', async () => {
  await homePage.addCurrentProductToCart();
});

Then("the product should be added to the cart", async () => {
  await expect(homePage.cartQuantityBadge).toBeDisplayed();
});

Then("the cart should reflect the selected quantity", async () => {
  await homePage.openCart();
  await homePage.waitForCartQuantityToMatch(scenarioState.selectedCartQuantity);
});

When("the user scrolls to the related products section", async () => {
  await homePage.scrollToRelatedProducts();
});

When('the user clicks "More information" on a related product', async () => {
  scenarioState.selectedRelatedProductName =
    await homePage.openFirstRelatedProduct();
});

Then("a new product details page should open", async () => {
  await homePage.waitForProductDetailPageToOpen();
});

Then("the selected related product name should be visible", async () => {
  const detailName = await homePage.productDetailName.getText();
  chaiExpect(detailName).to.contain(scenarioState.selectedRelatedProductName);
});
