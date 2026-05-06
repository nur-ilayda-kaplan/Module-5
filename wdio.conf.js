const fs = require("fs");
const isMac = process.platform === "darwin";

const defaultFirefoxPaths = {
  win32: [
    "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe",
  ],
  darwin: ["/Applications/Firefox.app/Contents/MacOS/firefox"],
  linux: ["/usr/bin/firefox", "/usr/local/bin/firefox"],
};

const firefoxBinary =
  process.env.FIREFOX_BINARY ||
  defaultFirefoxPaths[process.platform]?.find((path) => fs.existsSync(path));

const capabilities = [
  {
    browserName: "chrome",
    "goog:chromeOptions": {
      args: ["--headless=new", "--disable-gpu", "--window-size=1440,900"],
    },
  },
];

if (firefoxBinary) {
  capabilities.push({
    browserName: "firefox",
    "moz:firefoxOptions": {
      binary: firefoxBinary,
      args: ["-headless"],
    },
  });
}

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

  beforeScenario: async function () {
    // Start each scenario with a clean browser session so retries do not reuse stale app state.
    await browser.reloadSession();
  },

  afterScenario: async function () {
    // Ensure any cookies or storage state are cleared after each scenario.
    await browser.deleteAllCookies();
    await browser.execute(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  },

  // ChromeDriver is used for Chrome locally.
  // Firefox and Safari require the matching browser/driver support on the machine.
  services: [],
  suites: {
    smoke: ["./features/**/*.feature"],
  },
};
