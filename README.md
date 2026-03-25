# WDIO + Cucumber Setup

This repository contains a simple WebdriverIO project in JavaScript using Cucumber against `https://practicesoftwaretesting.com/`.

## Install Commands

Run the following from the project root:

```powershell
npm init -y
npm install -D @wdio/cli @wdio/local-runner @wdio/cucumber-framework @wdio/spec-reporter webdriverio expect-webdriverio wdio-chromedriver-service chromedriver
```

## Folder Structure

```text
Module-4/
|-- features/
|   |-- home.feature
|   `-- step-definitions/
|       `-- home.steps.js
|-- pages/
|   |-- base.page.js
|   `-- home.page.js
|-- .gitignore
|-- package.json
|-- README.md
`-- wdio.conf.js
```

## Run

```powershell
npm test
```

For the tagged smoke suite:

```powershell
npm run test:smoke
```
