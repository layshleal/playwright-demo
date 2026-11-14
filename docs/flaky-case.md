# Case study: a flaky test, from symptom to fix

A reproducible example of the most common cause of flaky UI tests: **asserting on a value read once, before the page is ready**. Everything below can be run from this repository. The numbers are from real runs.

- Page under test: [`demo-app/orders.html`](../demo-app/orders.html). A list of recent orders from a simulated API that is usually instant, but on about 1 in 5 page loads answers 500 ms later.
- Tests: [`tests/demo/flaky-case.spec.ts`](../tests/demo/flaky-case.spec.ts). The flaky version is kept on purpose but skipped by default, so CI stays trustworthy.

## 1. Symptom

The test passes locally and almost always in CI. Now and then a run is red with:

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 3
Received: 0
```

Re-running the job makes it green, so it is tempting to call it "infra noise" and move on. Each such run erodes trust in the suite, and after enough of them people stop reading red builds.

## 2. Reproduce and measure

First turn "now and then" into a number. `--repeat-each` runs the same test many times in one go:

```bash
SHOW_FLAKY=1 npx playwright test flaky-case --project=demo --grep "reads the list once" --repeat-each=50
```

| Run (50 repetitions each) | Passed | Failed | Reported as flaky |
|---|---|---|---|
| Flaky test, no retries | 45 | **5** | – |
| Flaky test, `--retries=2` (like CI) | 43 | **1** | **6** |
| Fixed test, no retries | **50** | 0 | – |

Two lessons are already visible:

- **A 10% failure rate is invisible in day-to-day work** but means roughly one red pipeline in ten for this test alone.
- **Retries hide the problem but do not remove it.** With two retries, 6 failures turned into "flaky" (green build) and 1 run still failed on all three attempts.

## 3. Diagnose

Tools used, in order:

1. **The HTML report's "flaky" label.** CI runs with retries and the report marks tests that only passed on a retry. The nightly run in this repo sets `FAIL_ON_FLAKY=true` (`failOnFlakyTests` in `playwright.config.ts`), so a flaky test fails the nightly job instead of hiding.
2. **The failure screenshot.** It shows the page still saying *"Loading orders…"* with an empty list. The test looked too early; the app was not broken.
3. **The trace, of the failing attempt.** Watch out: this repo (like most) records traces with `trace: 'on-first-retry'`, which captures the *retry*. For a flaky test the retry usually passes, so that trace shows a green run and `count()` returning `3`, which is useless for the diagnosis. While reproducing, record the failure itself:

   ```bash
   SHOW_FLAKY=1 npx playwright test flaky-case --project=demo --grep "reads the list once" --repeat-each=40 --trace=retain-on-failure
   npx playwright show-trace test-results/<failed-test>/trace.zip
   ```

   In the failing trace, `locator.count()` returns `0` right after navigation, and the DOM snapshot at that moment contains *"Loading orders…"* and no order at all.
4. **Force the slow path.** The page accepts `?delay=<ms>`. With `/orders.html?delay=500` the flaky pattern fails **5 out of 5** times. A timing bug you can trigger on demand is no longer a mystery.

## 4. Root cause

```ts
// flaky
await ordersPage.goto();
const count = await ordersPage.orders.count(); // one-off snapshot
expect(count).toBe(3);                          // plain value, never retried
```

`page.goto()` waits for the page `load` event, not for data fetched afterwards. `count()` reads the DOM **once**, and `expect(number).toBe()` compares a plain number, so nothing is retried. When the API is fast the list is already there and the test passes. When it is slow, the test checks an empty list.

## 5. Fix

```ts
// stable
await ordersPage.goto();
await expect(ordersPage.orders).toHaveCount(3);   // web-first assertion
await expect(ordersPage.loading).toBeHidden();
```

`expect(locator).toHaveCount()` is a **web-first assertion**: it re-checks the page until the condition is true or the expect timeout (5 s by default) runs out. It waits exactly as long as needed: 0 ms on a fast load, about 500 ms on a slow one.

A second test pins the worst case so the bug cannot come back silently:

```ts
await ordersPage.goto(1_500); // always slow
await expect(ordersPage.orders).toHaveCount(3);
```

Before keeping it, this test was checked against the old pattern: with `count()` + `toBe()` it failed 5 out of 5 runs.

## 6. Fixes that look right but are not

| "Fix" | Why it is wrong |
|---|---|
| `await page.waitForTimeout(1000)` | Slower on every run, and still flaky the day the API takes 1.1 s. This repo forbids fixed waits. |
| More retries | Hides the failure (see table above) and multiplies CI time when the bug hits. |
| Bigger global timeout | `count()` does not wait at all, so a timeout changes nothing here. |
| `await page.waitForLoadState('networkidle')` | Discouraged by Playwright, couples the test to network details, and does not guarantee the DOM is updated. |

## 7. Prevention

- Assert on **locators**, not on values pulled out of the page (`count()`, `textContent()`, `isVisible()`) followed by a plain `expect`.
- Add a **deterministic test for the slow path** whenever the app has asynchronous data (here via `?delay=`; in real projects via `page.route()` to delay or mock the API).
- When investigating, use **`--repeat-each` + `--trace=retain-on-failure`**: the trace you need is the one from the failed attempt, not from the retry.
- Keep **`FAIL_ON_FLAKY` in a scheduled run**, so retries help day-to-day PRs without hiding new flaky tests.
- Optional: the [`eslint-plugin-playwright`](https://github.com/playwright-community/eslint-plugin-playwright) rule `prefer-web-first-assertions` flags this pattern at review time.
