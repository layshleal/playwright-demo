# Playwright Demo – UI & API test automation

[![Playwright tests](https://github.com/layshleal/playwright-demo/actions/workflows/playwright.yml/badge.svg)](https://github.com/layshleal/playwright-demo/actions/workflows/playwright.yml)

**[View the latest test report](https://layshleal.github.io/playwright-demo/)** – all tests across Chromium, Firefox, mobile WebKit and the API, published from CI on every push to `main`.

A small but production-style test automation project built with **Playwright + TypeScript**.
It shows how I structure UI and API tests so they stay readable, stable, and fast in CI.

| Layer | Target | What is covered |
|-------|--------|-----------------|
| UI    | [saucedemo.com](https://www.saucedemo.com) | Login (happy path, locked user, validation), product sorting, cart, end-to-end checkout, price math |
| UI    | Local demo app (`demo-app/`) | Contact form in English, Italian and Portuguese, accessibility control pages |
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

**The scan is tested too.** A green accessibility scan only means something if it can fail. `tests/demo/accessibility-control.spec.ts` runs axe on a demo page with three deliberate violations (image without `alt`, button without a name, low-contrast text) and asserts that exactly those three are reported, each on the right element. It also checks that the clean contact page reports none.

Automated scanning only catches part of the accessibility issues (roughly 30–40% of WCAG problems). **Keyboard navigation** (focus order, visible focus, no keyboard traps) and **screen reader** experience (what is announced, and whether it makes sense) still need manual testing.

## Multilingual testing (EN / IT / PT)

The demo app loads its texts from `demo-app/i18n/<lang>.json`, and the tests import the same files. `tests/demo/i18n.spec.ts` runs the same contact flow in each language and checks:

- **Translation files** – every locale has the same keys as English, no empty values, no text left in English (with a documented allowlist, e.g. Italian "Email"), and placeholders like `{name}` kept.
- **Behaviour per language** – confirmation and validation messages, page title and `<html lang>` (used by screen readers).
- **Layout** – no translated text cut off or overflowing its element, a common bug when Italian or Portuguese strings are longer than English.

Because app and tests share the translation files, these tests catch missing, untranslated or broken texts, not a *wrong* translation. That still needs a native-speaker review.

## Visual regression

`tests/demo/visual.spec.ts` compares three screens of the demo app (English form, Italian validation error, Portuguese confirmation) against baseline images with `toHaveScreenshot`.

- **Baselines are generated in CI, not on a laptop.** Fonts and anti-aliasing differ between Windows, macOS and Linux, so a baseline made locally would fail in CI on pixel noise. The manual workflow **Update visual baselines** (`.github/workflows/update-snapshots.yml`) renders them on the same Ubuntu runner the tests use and uploads them as an artifact. They are reviewed by eye, then committed.
- **On non-Linux machines the visual tests are skipped** with a clear reason, instead of producing false failures.
- **Tolerance:** at most 100 pixels may differ (anti-aliasing), and animations are disabled. An absolute count on purpose: a 1% ratio was tried first and let a whole button change colour pass (the button is only ~0.5% of the page). A real change, like a different button colour, fails the test and the HTML report shows expected, actual and diff side by side.

To refresh baselines after an intended UI change:

```bash
gh workflow run update-snapshots.yml --ref <your-branch>
gh run download <run-id> -n visual-baselines -D tests/
```

## Flaky tests: a worked case

[`docs/flaky-case.md`](docs/flaky-case.md) walks through a deliberately flaky test on the demo app, from symptom to fix, with real numbers. The flaky version failed **5 of 50** runs, retries hid 6 failures and still let 1 through, and the fixed version passed **50 of 50**. It covers measuring with `--repeat-each`, why the default `on-first-retry` trace shows the *passing* retry, the root cause (a one-off `count()` instead of a web-first assertion), and the "fixes" to avoid (`waitForTimeout`, more retries).

## Design decisions

- **Why fixtures instead of `beforeEach` everywhere?** Fixtures make dependencies explicit and lazy: a test that asks for `loggedIn` gets a logged-in session, one that doesn't pays nothing.
- **Why test the price math?** Checking that `total = item total + tax` catches real business bugs, not just "the page loaded".
- **Why retries only in CI?** Locally a failure should be visible immediately; in CI retries with a trace help separate flaky tests from real regressions.

## Author

**Helena Leal** – QA Engineer · Playwright, API testing, CI
[LinkedIn](https://www.linkedin.com/in/lays-helena-leal/)
