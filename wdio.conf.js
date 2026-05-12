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

function resolveFirefoxBinary() {
  return (
    process.env.FIREFOX_BINARY ||
    defaultFirefoxPaths[process.platform]?.find((path) => fs.existsSync(path))
  );
}

/**
 * Build the full W3C-style capability list (one object per browser).
 * Do not leave holes in the array — WDIO's mapCapabilities expects every entry to be a valid object.
 */
function buildAllCapabilities() {
  const list = [];

  list.push({
    browserName: "chrome",
    "goog:chromeOptions": {
      args: ["--headless=new", "--disable-gpu", "--window-size=1440,900"],
    },
  });

  const firefoxBinary = resolveFirefoxBinary();
  if (firefoxBinary) {
    list.push({
      browserName: "firefox",
      "moz:firefoxOptions": {
        binary: firefoxBinary,
        args: ["-headless"],
      },
    });
  }

  if (isMac) {
    list.push({
      browserName: "safari",
      acceptInsecureCerts: true,
      // Per-capability concurrency (replaces non-standard wdio:maxInstances on the capability object).
      maxInstances: 1,
    });
  }

  return list;
}

/**
 * Single-browser runs must not use CLI flags like --capabilities.browserName=…
 * (WDIO 9 can merge those into an invalid shape and trigger alwaysMatch on undefined).
 * Use env BROWSER=chrome | firefox | safari instead.
 */
function pickCapabilities(all) {
  const want = (process.env.BROWSER || "").toLowerCase().trim();
  if (!want) {
    return all;
  }

  const picked = all.filter(
    (cap) =>
      cap &&
      typeof cap.browserName === "string" &&
      cap.browserName.toLowerCase() === want,
  );

  if (picked.length === 0) {
    const available = all.map((c) => c.browserName).join(", ");
    throw new Error(
      `[wdio.conf.js] BROWSER="${process.env.BROWSER}" matches no capability. ` +
        `Available: ${available || "(none)"}. ` +
        `For Firefox, install the browser or set FIREFOX_BINARY to firefox.exe.`,
    );
  }

  if (want === "safari" && !isMac) {
    throw new Error(
      '[wdio.conf.js] BROWSER="safari" is only supported on macOS in this project.',
    );
  }

  return picked;
}

const capabilities = pickCapabilities(buildAllCapabilities());

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
