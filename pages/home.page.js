const BasePage = require("./base.page");

class HomePage extends BasePage {
  get searchInput() {
    return $('[data-test="search-query"]');
  }

  get searchSubmitButton() {
    return $('[data-test="search-submit"]');
  }

  get filtersPanel() {
    return $('[data-test="filters"]');
  }

  get sortDropdown() {
    return $('[data-test="sort"]');
  }

  get productCards() {
    return $$('[data-test^="product-"]');
  }

  get productNames() {
    return $$('[data-test="product-name"]');
  }

  get productPrices() {
    return $$('[data-test="product-price"]');
  }

  get productDetailName() {
    return $('h1[data-test="product-name"]');
  }

  get productDetailPrice() {
    return $('[data-test="unit-price"]');
  }

  get addToCartButton() {
    return $('[data-test="add-to-cart"]');
  }

  get increaseQuantityButton() {
    return $('[data-test="increase-quantity"]');
  }

  get quantityInput() {
    return $('[data-test="quantity"]');
  }

  get cartQuantityBadge() {
    return $('[data-test="cart-quantity"]');
  }

  get cartLink() {
    return $('[data-test="nav-cart"]');
  }

  get allCategoryFilterInputs() {
    return $$('[data-test^="category-"]');
  }

  get allBrandFilterInputs() {
    return $$('[data-test^="brand-"]');
  }

  async open() {
    await super.open("/");
    await this.searchInput.waitForDisplayed({ timeout: 10000 });
    await browser.waitUntil(async () => (await this.productCards.length) > 0, {
      timeout: 15000,
      timeoutMsg: "Product cards did not load on the home page",
    });
  }

  async enterSearchText(searchText) {
    await this.searchInput.waitForDisplayed({ timeout: 10000 });
    await this.searchInput.clearValue();
    await this.searchInput.setValue(searchText);
  }

  async submitSearch() {
    await this.searchSubmitButton.waitForClickable({ timeout: 10000 });
    await this.searchSubmitButton.click();
  }

  async waitForFiltersToBeVisible() {
    const filterContainers = await $$('[data-test="filters"]');

    for (const filterContainer of filterContainers) {
      if (await filterContainer.isDisplayed()) {
        if (await filterContainer.isClickable()) {
          await filterContainer.click();
        }
      }
    }

    await browser.waitUntil(
      async () => {
        const categories = await this.allCategoryFilterInputs;
        const brands = await this.allBrandFilterInputs;
        const ranges = await $$('input[type="range"]');

        return categories.length > 0 || brands.length > 0 || ranges.length > 0;
      },
      {
        timeout: 10000,
        timeoutMsg: "Filter controls were not found",
      },
    );
  }

  async waitForSortToBeVisible() {
    await this.sortDropdown.waitForDisplayed({ timeout: 10000 });
    await this.sortDropdown.waitForClickable({ timeout: 10000 });
  }

  async getProductListSnapshot() {
    const names = await this.getVisibleProductNames();
    const prices = await this.getVisibleProductPrices();
    const length = Math.max(names.length, prices.length);

    return Array.from({ length }, (_, index) => {
      const name = names[index] || "";
      const price = prices[index] !== undefined ? prices[index] : "";
      return `${name}:${price}`;
    }).join("|");
  }

  async waitForProductListToChange(previousSnapshot) {
    let lastSnapshot = previousSnapshot || "";
    let stableCount = 0;

    await browser.waitUntil(
      async () => {
        const currentSnapshot = await this.getProductListSnapshot();

        if (!currentSnapshot) {
          stableCount = 0;
          lastSnapshot = currentSnapshot;
          return false;
        }

        if (currentSnapshot === lastSnapshot) {
          stableCount += 1;
        } else {
          stableCount = 1;
          lastSnapshot = currentSnapshot;
        }

        return stableCount >= 2;
      },
      {
        timeout: 15000,
        interval: 300,
        timeoutMsg: "Product list did not stabilize",
      },
    );
  }

  async waitForProductListToBeStable() {
    await this.waitForProductListToChange();
  }

  async selectFirstCategory() {
    await this.waitForFiltersToBeVisible();

    const categories = await this.allCategoryFilterInputs;
    const firstCategory = categories[0];

    await firstCategory.waitForExist({ timeout: 10000 });
    const categoryDataTest = await firstCategory.getAttribute("data-test");
    const categoryName = await browser.execute(
      (input) => (input.parentElement?.textContent || "").trim(),
      await firstCategory,
    );

    await browser.execute((input) => input.click(), await firstCategory);

    return { name: categoryName, dataTest: categoryDataTest };
  }

  async isFilterCheckedByDataTest(dataTest) {
    const input = await $(`[data-test="${dataTest}"]`);
    return await input.isSelected();
  }

  async selectFirstBrand() {
    await this.waitForFiltersToBeVisible();

    const brands = await this.allBrandFilterInputs;
    const firstBrand = brands[0];

    await firstBrand.waitForExist({ timeout: 10000 });
    const brandDataTest = await firstBrand.getAttribute("data-test");
    const brandName = await browser.execute(
      (input) => (input.parentElement?.textContent || "").trim(),
      await firstBrand,
    );

    await browser.execute((input) => input.click(), await firstBrand);

    return { name: brandName, dataTest: brandDataTest };
  }

  async applyPriceRangeFilter() {
    const minPointer = await $(".ngx-slider-pointer-min");
    const maxPointer = await $(".ngx-slider-pointer-max");

    await minPointer.waitForDisplayed({ timeout: 10000 });
    await maxPointer.waitForDisplayed({ timeout: 10000 });

    const beforeMin = Number(await $(".ngx-slider-model-value").getText());
    const beforeMax = Number(await $(".ngx-slider-model-high").getText());

    await minPointer.click();
    for (let index = 0; index < 5; index += 1) {
      await browser.keys("ArrowRight");
    }

    await maxPointer.click();
    for (let index = 0; index < 5; index += 1) {
      await browser.keys("ArrowLeft");
    }

    await browser.waitUntil(
      async () => {
        const currentMin = Number(await $(".ngx-slider-model-value").getText());
        const currentMax = Number(await $(".ngx-slider-model-high").getText());
        return currentMin !== beforeMin || currentMax !== beforeMax;
      },
      {
        timeout: 10000,
        timeoutMsg: "Price range did not change",
      },
    );

    const minPrice = Number(await $(".ngx-slider-model-value").getText());
    const maxPrice = Number(await $(".ngx-slider-model-high").getText());

    return { minPrice, maxPrice };
  }

  async selectSortingOption() {
    await this.waitForSortToBeVisible();

    const options = await this.sortDropdown.$$("option");
    let selectedOption = null;

    for (const option of options) {
      const value = await option.getAttribute("value");
      if (value) {
        selectedOption = {
          value,
          text: (await option.getText()).trim(),
        };
        break;
      }
    }

    if (!selectedOption) {
      throw new Error("No selectable sort option found");
    }

    await this.sortDropdown.selectByAttribute("value", selectedOption.value);

    return selectedOption;
  }

  async getValuesForSort(sortValue) {
    const value = sortValue.toLowerCase();

    if (value.includes("price")) {
      return await this.getVisibleProductPrices();
    }

    return await this.getVisibleProductNames();
  }

  async isSorted(values, sortValue) {
    const normalized = sortValue.toLowerCase();
    const expected = [...values];

    if (normalized.includes("price")) {
      expected.sort((a, b) => a - b);
    } else {
      expected.sort((a, b) => a.localeCompare(b));
    }

    if (normalized.includes("desc")) {
      expected.reverse();
    }

    return (
      values.length > 0 &&
      values.every((value, index) => value === expected[index])
    );
  }

  async assertProductsAreInSelectedOrder(sortValue) {
    await this.waitForProductListToBeStable();

    await browser.waitUntil(
      async () => {
        const values = await this.getValuesForSort(sortValue);
        return this.isSorted(values, sortValue);
      },
      {
        timeout: 15000,
        interval: 300,
        timeoutMsg: `Products did not settle into expected sort order for "${sortValue}"`,
      },
    );

    const finalValues = await this.getValuesForSort(sortValue);
    const expectedValues = [...finalValues];
    const value = sortValue.toLowerCase();

    if (value.includes("price")) {
      expectedValues.sort((a, b) => a - b);
    } else {
      expectedValues.sort((a, b) => a.localeCompare(b));
    }

    if (value.includes("desc")) {
      expectedValues.reverse();
    }

    expect(finalValues).toEqual(expectedValues);
  }

  async openFirstProductFromList() {
    const firstProduct = await $('[data-test^="product-"]');

    await firstProduct.waitForDisplayed({ timeout: 10000 });
    await firstProduct.scrollIntoView();
    await browser.pause(300); // Wait for scroll animation
    await firstProduct.waitForClickable({ timeout: 10000 });
    await firstProduct.click();

    await this.waitForProductDetailPageToOpen();
  }

  async waitForProductDetailPageToOpen() {
    // First wait for URL to change to product page
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes("/product/"),
      {
        timeout: 10000,
        timeoutMsg: "Product details page URL did not load",
      },
    );

    // Then wait for page elements to be displayed
    await this.productDetailName.waitForDisplayed({ timeout: 10000 });
    await this.productDetailPrice.waitForDisplayed({ timeout: 10000 });
  }

  async setProductQuantity(targetQuantity) {
    await this.quantityInput.waitForDisplayed({ timeout: 10000 });
    await this.increaseQuantityButton.waitForClickable({ timeout: 10000 });

    const currentQuantity = Number(await this.quantityInput.getValue()) || 1;
    const clickCount = Math.max(0, targetQuantity - currentQuantity);

    for (let index = 0; index < clickCount; index += 1) {
      await this.increaseQuantityButton.click();
    }
  }

  async addCurrentProductToCart() {
    await this.addToCartButton.waitForClickable({ timeout: 10000 });
    await this.addToCartButton.click();

    await browser.waitUntil(
      async () => await this.cartQuantityBadge.isDisplayed(),
      {
        timeout: 10000,
        timeoutMsg: "Cart quantity badge did not appear",
      },
    );
  }

  /**
   * ngx-toastr (#toast-container .ngx-toastr) can sit over the header in Firefox while
   * Chrome often leaves [data-test="nav-cart"] uncovered. We wait until hit-testing at
   * the cart shows the cart (or its children), and optionally dismiss the toast via
   * tapToDismiss instead of relying on fixed sleeps.
   */
  async waitUntilCartLinkIsNotCoveredByOverlay() {
    const cartSelector = '[data-test="nav-cart"]';

    await browser.waitUntil(
      async () => {
        const hitTest = await browser.execute((selector) => {
          const el = document.querySelector(selector);
          if (!el) return { clear: false };

          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return { clear: false };

          const midY = rect.top + rect.height / 2;
          const sample = (px, py) => {
            const top = document.elementFromPoint(px, py);
            return Boolean(top && (el === top || el.contains(top)));
          };

          const xs = [
            rect.left + rect.width * 0.5,
            rect.left + rect.width * 0.88,
            rect.left + Math.max(4, rect.width * 0.12),
          ];

          if (xs.some((x) => sample(x, midY))) {
            return { clear: true };
          }

          const cx = rect.left + rect.width * 0.5;
          const cy = midY;
          const hit = document.elementFromPoint(cx, cy);
          const toast = hit && hit.closest && hit.closest("#toast-container .ngx-toastr");
          if (toast) {
            toast.click();
          }

          return { clear: false };
        }, cartSelector);

        return hitTest.clear === true;
      },
      {
        timeout: 15000,
        interval: 200,
        timeoutMsg:
          "Cart link stayed covered by an overlay (e.g. success toast)",
      },
    );
  }

  async openCart() {
    await this.cartLink.waitForExist({ timeout: 10000 });
    await this.cartLink.waitForDisplayed({ timeout: 10000 });
    await this.cartLink.scrollIntoView({ block: "nearest", inline: "nearest" });
    await this.waitUntilCartLinkIsNotCoveredByOverlay();

    await this.cartLink.click();

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes("/checkout"),
      { timeout: 10000, timeoutMsg: "Cart page did not open" },
    );
  }

  async waitForCartQuantityToMatch(expectedQuantity) {
    await browser.waitUntil(
      async () => {
        const quantityInputs = await $$('input[type="number"]');

        for (const input of quantityInputs) {
          const value = Number(await input.getValue());
          if (value === expectedQuantity) {
            return true;
          }
        }

        return false;
      },
      {
        timeout: 10000,
        timeoutMsg: `No cart quantity input matched ${expectedQuantity}`,
      },
    );
  }

  async scrollToRelatedProducts() {
    await browser.execute(() => window.scrollTo(0, document.body.scrollHeight));

    await browser.waitUntil(
      async () => {
        const links = await $$('a.card[href*="/product/"]');
        return links.length > 0;
      },
      {
        timeout: 10000,
        timeoutMsg: "Related product cards did not appear",
      },
    );
  }

  async openFirstRelatedProduct() {
    const relatedProductLinks = await $$('a.card[href*="/product/"]');

    if (relatedProductLinks.length === 0) {
      throw new Error("No related product links found");
    }

    const firstRelated = relatedProductLinks[0];
    const relatedCardText = (await firstRelated.getText()).trim();
    const relatedProductName = relatedCardText
      .replace(/more information/gi, "")
      .replace(/daha fazla bilgi/gi, "")
      .trim();

    await firstRelated.waitForClickable({ timeout: 10000 });
    await firstRelated.click();

    return relatedProductName;
  }

  async getVisibleProductNames() {
    await browser.waitUntil(
      async () => {
        const items = await this.productNames;
        return items.length > 0;
      },
      {
        timeout: 10000,
        timeoutMsg: "Product results did not load",
      },
    );

    const visibleNames = [];
    const productNameElements = await this.productNames;

    for (const element of productNameElements) {
      if (await element.isDisplayed()) {
        visibleNames.push((await element.getText()).trim());
      }
    }

    return visibleNames;
  }

  async getVisibleBrandNames() {
    const brandNames = await browser.execute(() => {
      const cards = Array.from(document.querySelectorAll("a.card"));

      return cards
        .map((card) => {
          const meta = card.querySelector(".card-text, small, p");
          return meta ? meta.textContent.trim() : "";
        })
        .filter(Boolean);
    });

    return brandNames;
  }

  async doVisibleCardsContainBrand(brandName) {
    const allCardTexts = await browser.execute(() =>
      Array.from(document.querySelectorAll("a.card")).map((card) =>
        (card.textContent || "").trim(),
      ),
    );

    const normalizedBrand = brandName.toLowerCase();
    const cardsWithBrandText = allCardTexts.filter((text) =>
      text.toLowerCase().includes(normalizedBrand),
    );

    if (cardsWithBrandText.length === 0) {
      return true;
    }

    return cardsWithBrandText.length === allCardTexts.length;
  }

  async doVisibleCardsContainCategory(categoryName) {
    const allCardTexts = await browser.execute(() =>
      Array.from(document.querySelectorAll("a.card")).map((card) =>
        (card.textContent || "").trim(),
      ),
    );

    const normalizedCategory = categoryName.toLowerCase();
    const cardsWithCategoryText = allCardTexts.filter((text) =>
      text.toLowerCase().includes(normalizedCategory),
    );

    if (cardsWithCategoryText.length === 0) {
      return true;
    }

    return cardsWithCategoryText.length === allCardTexts.length;
  }

  async getVisibleProductPrices() {
    const prices = [];
    const priceElements = await this.productPrices;

    for (const element of priceElements) {
      if (await element.isDisplayed()) {
        const rawPrice = await element.getText();
        const parsedPrice = Number(rawPrice.replace(/[^0-9.]/g, ""));

        if (!Number.isNaN(parsedPrice)) {
          prices.push(parsedPrice);
        }
      }
    }

    return prices;
  }
}

module.exports = new HomePage();
