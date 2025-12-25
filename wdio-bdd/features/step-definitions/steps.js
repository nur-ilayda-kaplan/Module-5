const { Given, When, Then } = require("@wdio/cucumber-framework");
const { expect: wdioExpect, $, browser } = require("@wdio/globals");
const { assert, expect: chaiExpect, should } = require("chai");

// Enable Chai should interface
should();

const LoginPage = require("../pageobjects/login.page");
const SecurePage = require("../pageobjects/secure.page");

const pages = {
  login: LoginPage,
};

Given(/^I am on the (\w+) page$/, async (page) => {
  await pages[page].open();
  
  // Using Chai Assert interface to verify URL
  const currentUrl = await browser.getUrl();
  assert.include(
    currentUrl,
    "/login",
    `Expected URL to contain '/login', but got: ${currentUrl}`
  );
});

When(/^I login with (.+) and (.+)$/, async (username, password) => {
  // Using Chai Should interface to verify form elements exist
  const usernameExists = await LoginPage.inputUsername.isExisting();
  const passwordExists = await LoginPage.inputPassword.isExisting();
  
  // Using Chai Expect interface
  chaiExpect(usernameExists).to.be.true;
  
  // Using Chai Should interface (direct should syntax)
  passwordExists.should.be.true;
  
  await LoginPage.login(username, password);
});

Then(/^I should see a flash message saying (.+)$/, async (message) => {
  // Using WDIO expect (already implemented)
  await wdioExpect(SecurePage.flashAlert).toBeExisting();
  await wdioExpect(SecurePage.flashAlert).toHaveText(
    wdioExpect.stringContaining(message)
  );
  
  // Using Chai Expect interface to verify flash message
  const flashText = await SecurePage.flashAlert.getText();
  chaiExpect(flashText).to.include(message);
  
  // Additional assertion using Chai Assert interface
  const isDisplayed = await SecurePage.flashAlert.isDisplayed();
  assert.isTrue(isDisplayed, "Flash message should be displayed");
});
