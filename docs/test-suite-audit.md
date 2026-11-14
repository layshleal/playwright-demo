# Test suite audit checklist

The questions I ask when auditing a team's automated tests, with what "good" looks like and where this repository shows it. Every item is something I can measure or demonstrate, not an opinion.

**How an audit runs**

1. Read the configuration, the CI workflow and a sample of tests.
2. Run the suite many times (`--repeat-each`, CI re-runs) to measure the real flaky rate.
3. Break the application and the tests on purpose to see which failures the suite actually catches.
4. Deliver a short report: findings ranked by risk, each with evidence and a concrete fix.

---

## 1. Does a red test mean something, and does a green one?

| Check | Good looks like | Evidence here |
|---|---|---|
| New tests are seen failing before they are trusted | The assertion is broken on purpose, the run goes red, then it is restored | Each test added after the first release, as described in its commit message; e.g. the [visual tolerance](../playwright.config.ts) was tightened after a deliberate change slipped through |
| Checks that "never find anything" are themselves tested | Control pages or payloads with known defects | [accessibility control](../tests/demo/accessibility-control.spec.ts), [schema control](../tests/api/booking-schema.spec.ts) |
| Assertions check what the user sees | Messages asserted as **visible**, not only present in the DOM | [contact](../tests/demo/contact.spec.ts), [network mocking](../tests/demo/network-mocking.spec.ts) |
| Tolerances are tight enough to fail | A deliberate, real change fails the test | Visual tolerance: 1% let a recoloured button pass, now 100 px ([README](../README.md#visual-regression)) |

**Red flags:** a suite that has never been seen failing; `toHaveText` on elements that are always in the HTML; percentage tolerances on full-page screenshots.

## 2. Flakiness

| Check | Good looks like | Evidence here |
|---|---|---|
| No fixed waits, web-first assertions only | Enforced by lint, not by code review memory | [eslint.config.mjs](../eslint.config.mjs) |
| No forgotten `await` | Type-aware lint rule (`no-floating-promises`) | [eslint.config.mjs](../eslint.config.mjs) |
| Retries do not hide flakes | Retries in CI, plus a scheduled run that fails on any flaky test | `failOnFlakyTests` in [playwright.config.ts](../playwright.config.ts), nightly job in [the workflow](../.github/workflows/playwright.yml) |
| The trace shows the failure, not the retry | `trace: 'retain-on-first-failure'` | [playwright.config.ts](../playwright.config.ts), [flaky case](flaky-case.md) |
| Flaky tests are measured and fixed at the cause | Failure rate before/after, root cause named | [flaky case](flaky-case.md): 5/50 → 0/50 |

**Red flags:** `waitForTimeout`; retry counts above 2; "re-run the job" as the team's fix; traces only on retry.

## 3. Coverage that matters

| Check | Good looks like | Evidence here |
|---|---|---|
| Browsers the users actually have | Chromium, Firefox, mobile WebKit | [projects](../playwright.config.ts) |
| Every UI state, not only the happy path | Slow, failing, offline and empty backends forced with `page.route()` | [network mocking](../tests/demo/network-mocking.spec.ts) |
| Accessibility beyond a scanner | axe scans **and** keyboard tests (Tab order, visible focus) | [accessibility](../tests/ui/accessibility.spec.ts), [keyboard](../tests/demo/keyboard.spec.ts) |
| Every language that ships | Same flow per language, missing/untranslated/cut-off text detected | [i18n](../tests/demo/i18n.spec.ts) |
| API contracts, not only values | Strict schemas on every response | [schemas](../schemas/booking.ts) |
| What happens when clients get it wrong | Negative cases; known defects documented as tests | [negative cases](../tests/api/booking-negative.spec.ts) |

**Red flags:** happy-path only; accessibility "planned for later"; one language tested; API tests that only check status codes.

## 4. Speed and feedback

| Check | Good looks like | Evidence here |
|---|---|---|
| Fast CI feedback | Parallel jobs, a few minutes per push | ~1.5 min per push, 5 test jobs in parallel |
| A quick subset for fast checks | Tagged smoke tests | `npm run test:smoke` |
| Optimisations are measured, not assumed | Before/after numbers; reverted if no gain | Login reuse measured over 3+3 CI runs, no gain, reverted ([README](../README.md#design-decisions)) |

**Red flags:** suites nobody runs locally because they take too long; "optimisations" with no numbers.

## 5. Maintainability

| Check | Good looks like | Evidence here |
|---|---|---|
| Structure | Page objects, fixtures, test data apart from tests | [pages](../pages), [fixtures](../fixtures/test.ts), [test-data](../test-data) |
| Stable locators | Roles, labels and test ids; no CSS/XPath chains | All page objects |
| Static checks in CI | Type check and lint as their own job | `lint` job in [the workflow](../.github/workflows/playwright.yml) |
| Dependencies kept current, safely | Automated update PRs validated by CI; incompatible ones held with a reason | [dependabot.yml](../.github/dependabot.yml) (TypeScript 7 held: PR #1 failed CI) |
| Reproducible environment | CI runner image pinned where results depend on it | `ubuntu-26.04` pinned for visual baselines |

**Red flags:** selectors copied from DevTools; no lint; dependencies years old; `ubuntu-latest` with screenshot tests.

## 6. Reporting and data

| Check | Good looks like | Evidence here |
|---|---|---|
| Anyone can see the results | HTML report published from CI, JUnit for tooling | [live report](https://layshleal.github.io/playwright-demo/) |
| Known problems are visible, not hidden | Annotations in the report instead of skipped tests | `known-api-defect` annotations |
| Tests do not collide on shared data | Unique data per run; secrets in environment variables | Unique last names in [API tests](../tests/api/booking.spec.ts), `API_USER`/`API_PASSWORD` |

**Red flags:** results only in CI logs; skipped tests with no reason; tests that fail when two people run them at once.
