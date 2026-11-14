# Playwright Demo – UI & API test automation

[![Playwright tests](https://github.com/layshleal/playwright-demo/actions/workflows/playwright.yml/badge.svg)](https://github.com/layshleal/playwright-demo/actions/workflows/playwright.yml)

**[View the latest test report](https://layshleal.github.io/playwright-demo/)** – all tests across Chromium, Firefox, mobile WebKit and the API, published from CI on every push to `main`.

A small but production-style test automation project built with **Playwright + TypeScript**.
It shows how I structure UI and API tests so they stay readable, stable, and fast in CI.

| Layer | Target | What is covered |
|-------|--------|-----------------|
| UI    | [saucedemo.com](https://www.saucedemo.com) | Login (happy path, locked user, validation), product sorting, cart, end-to-end checkout, price math |
| UI    | Local demo app (`demo-app/`) | Contact form (submission, required-field validation) on pages we control |
| API   | [Restful Booker](https://restful-booker.herokuapp.com/apidoc/index.html) | Auth, full CRUD lifecycle, authorization errors, query filters |

## Highlights

- **Page Object Model** – one class per page, tests read like user stories.
- **Custom fixtures** – page objects and a `loggedIn` state are injected into tests, no setup duplication.
- **Stable locators** – `getByTestId` / `getByRole` only, no CSS or XPath chains.
- **Data-driven tests** – login validation runs from a table of cases.
- **Cross-browser & mobile** – Chromium, Firefox and WebKit (iPhone 15 Pro emulation).
- **Local demo app** – a static site started by Playwright's `webServer` (Node built-ins only, no extra dependencies), for scenarios a third-party site cannot provide.
- **API tests in the same framework** – using Playwright's `request` fixture, no extra libraries.
- **Tags** – `@smoke` subset for quick feedback.
- **CI-ready** – GitHub Actions matrix per project, nightly schedule, retries + traces on failure, HTML and JUnit reports uploaded as artifacts, merged HTML report published to GitHub Pages.

## Project structure

```
├── .github/workflows/playwright.yml   # CI: matrix per browser + demo + API, nightly run
├── demo-app/                          # local static site + tiny Node server (webServer)
├── fixtures/test.ts                   # custom fixtures (page objects, logged-in state)
├── pages/                             # Page Object Model
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── ContactPage.ts                 # demo app
├── test-data/users.ts                 # test users and customer data
├── tests/
│   ├── ui/                            # login, inventory, checkout, accessibility
│   ├── demo/                          # tests against the local demo app
│   └── api/                           # booking API
└── playwright.config.ts               # projects: chromium, firefox, mobile, demo, api
```

## Running locally

```bash
npm install
npx playwright install        # browsers

npm test                      # everything
npm run test:smoke            # @smoke tests only
npm run test:api              # API only
npm run test:ui               # UI on all browsers
npm run test:headed           # watch it run in Chromium
npm run report                # open the HTML report
```

Debug a single test with the UI mode:

```bash
npx playwright test --ui
```

## Accessibility

`tests/ui/accessibility.spec.ts` scans the key pages with [axe-core](https://github.com/dequelabs/axe-core) against WCAG 2.1 A/AA rules. Serious and critical violations fail the test; the full axe result is attached to the HTML report.

Automated scanning only catches part of the accessibility issues (roughly 30–40% of WCAG problems). **Keyboard navigation** (focus order, visible focus, no keyboard traps) and **screen reader** experience (what is announced, and whether it makes sense) still need manual testing.

## Design decisions

- **Why fixtures instead of `beforeEach` everywhere?** Fixtures make dependencies explicit and lazy: a test that asks for `loggedIn` gets a logged-in session, one that doesn't pays nothing.
- **Why test the price math?** Checking that `total = item total + tax` catches real business bugs, not just "the page loaded".
- **Why retries only in CI?** Locally a failure should be visible immediately; in CI retries with a trace help separate flaky tests from real regressions.

## Author

**Helena Leal** – QA Engineer · Playwright, API testing, CI
[LinkedIn](https://www.linkedin.com/in/lays-helena-leal/)
