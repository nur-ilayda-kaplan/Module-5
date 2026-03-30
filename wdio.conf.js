const isMac = process.platform === "darwin";

const capabilities = [
  {
    browserName: "chrome",
    "goog:chromeOptions": {
      args: ["--headless=new", "--disable-gpu", "--window-size=1440,900"],
    },
  },
  {
    browserName: "firefox",
    "moz:firefoxOptions": {
      args: ["-headless"],
    },
  },
];

if (isMac) {
  capabilities.push({
    browserName: "safari",
    // Safari does not support headless mode.
    "wdio:maxInstances": 1,
    acceptInsecureCerts: true,
  });
}

exports.config = {
  runner: "local",
  specs: ["./features/**/*.feature"],
  maxInstances: 2,
  capabilities,
  // This runs Chrome and Firefox everywhere, and Safari only on macOS.
  logLevel: "info",
  bail: 0,
  baseUrl: "https://practicesoftwaretesting.com",
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: "cucumber",
  reporters: ["spec"],
  // Keep feature files in ./features and step definitions in ./features/step-definitions.
  cucumberOpts: {
    require: [
      "./features/support/chai.js",
      "./features/step-definitions/**/*.js",
    ],
    backtrace: false,
    dryRun: false,
    failFast: false,
    snippets: true,
    source: true,
    strict: true,
    tagExpression: "",
    timeout: 60000,
    ignoreUndefinedDefinitions: false,
    retry: 2,
  },
  before: async function () {
    if (browser.capabilities.browserName === "safari") {
      await browser.maximizeWindow();
    }
  },
  // ChromeDriver is used for Chrome locally.
  // Firefox and Safari require the matching browser/driver support on the machine.
  services: [],
  suites: {
    smoke: ["./features/**/*.feature"],
  },
};
