const { Given, Then, When } = require("@wdio/cucumber-framework");
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

    expect(visibleProductNames.length).toBeGreaterThan(0);
    expect(allResultsMatch).toBe(true);
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

  expect(categoryIsApplied).toBe(true);

  const productNames = await homePage.getVisibleProductNames();
  expect(productNames.length).toBeGreaterThan(0);
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

  expect(brandIsApplied).toBe(true);
  expect(cardsMatchBrand).toBe(true);
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

  expect(visiblePrices.length).toBeGreaterThan(0);
  expect(
    visiblePrices.every(
      (price) =>
        price >= scenarioState.selectedMinPrice &&
        price <= scenarioState.selectedMaxPrice,
    ),
  ).toBe(true);
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
  expect(detailName).toContain(scenarioState.selectedRelatedProductName);
});
