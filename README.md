# ICRT Product Insights

A Vue 3 dashboard for exploring dishwasher test results at three subscription tiers.

## Run locally

Requires Node 22 and npm 11.5.2.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Use the profile menu to switch between Basic, Premium and Enterprise.

Run the production image with Docker:

```sh
docker build -t icrt-product-insights .
docker run --rm -p 8080:80 icrt-product-insights
```

Open `http://localhost:8080`.

## Verification

```sh
npm run lint:check
npm run type-check
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

## Part A decisions

- The supplied aggregates cover 15 products, while the payload contains three product records. The dashboard shows "3 of 15" and does not recalculate the aggregates from a different set.
- The comparison uses horizontal bars. They use the wide layout well, make the category average easy to read as a vertical reference, and can extend downwards as more products are added. A bullet chart was considered, but it asks readers to learn a less familiar visual grammar.
- Time to result is shown in the tooltip and accessible table, not as a second chart series. Score and time measure different things, and three records cannot support an implied correlation.
- The average line is a small local Chart.js plugin. Adding a package for one dashed line was not justified.
- Basic sees a blurred skeleton, not blurred product data. CSS blur is not an access control and no product identifier reaches the DOM.
- Premium can focus the unavailable export button and read why it is unavailable. `aria-disabled` is advisory, so the click and keyboard handlers also refuse the action.
- The chart is loaded only after the comparison capability is granted. PDF code is loaded only when an Enterprise user exports. The main path does not pay for either dependency up front.
- There is no router, store, shared button abstraction or composable with one consumer. Those mechanisms do not solve a current problem in this single-page application.

The tier control is a demonstration harness. In production, entitlements would come from the authenticated session and current subscription, not from a user-controlled menu. The static payload is imported because the brief requires frontend parsing. This means product values exist in the built JavaScript for this exercise. A production Basic response would omit them at the API boundary.

## Part B

### 1. Database schema

I would use one PostgreSQL database. The data is relational and consistency-sensitive. Test results are authoritative records that members publish and manufacturers may dispute, so two readers must not see different versions of a published evaluation.

| Table                | Important columns and constraints                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `organisations`      | `id` PK, `name`, `created_at`                                                                                                                  |
| `users`              | `id` PK, `organisation_id` FK, `email` UNIQUE, `role`                                                                                          |
| `plans`              | `id` PK, `code` UNIQUE, `name`                                                                                                                 |
| `plan_features`      | (`plan_id` FK, `feature_code`) composite PK                                                                                                    |
| `subscriptions`      | `id` PK, `organisation_id` FK, `plan_id` FK, `status`, `starts_at`, `ends_at`                                                                  |
| `categories`         | `id` PK, `name` UNIQUE                                                                                                                         |
| `products`           | `id` PK, `category_id` FK, `brand`, `model`, UNIQUE (`category_id`, `brand`, `model`)                                                          |
| `laboratories`       | `id` PK, `name`, `accreditation_code` UNIQUE                                                                                                   |
| `evaluations`        | `id` PK, `product_id` FK, `laboratory_id` FK, `protocol_version`, `sample_received_at`, `published_at`, `composite_score`                      |
| `metric_definitions` | `id` PK, `category_id` FK, `code`, `label`, `unit`, `scale_min`, `scale_max`, `weight`, `contributes_to_score`, UNIQUE (`category_id`, `code`) |
| `test_metrics`       | `evaluation_id` FK, `metric_definition_id` FK, `value numeric`, composite PK (`evaluation_id`, `metric_definition_id`)                         |
| `reports`            | `id` PK, `evaluation_id` FK, `download_id` UNIQUE, `storage_key` UNIQUE, `created_at`                                                          |

A composite score is a weighted result, not a measurement. Some supplementary attributes intentionally do not affect it, which is why metric definitions carry both `weight` and `contributes_to_score`. Qualitative ratings are stored as documented ordinals. `ttr_days` is calculated from `published_at - sample_received_at`, not stored where it can drift.

Criteria are rows, so adding a criterion does not require a migration. The cost is weaker column-level type constraints and a pivot for cross-metric reports. A `jsonb` value would be easier to write, but would lose referential integrity over the controlled criteria used across members and markets.

Indexes follow the main reads: `products(category_id)`, `evaluations(product_id, published_at DESC)`, `test_metrics(evaluation_id)`, `users(organisation_id)`, and a partial `subscriptions(organisation_id) WHERE status = 'active'`. If volume later made these insufficient, I would first measure query plans and partition the largest evaluation tables by publication date.

### 2. API security

The frontend gate is user experience, not security. The backend authenticates the token, resolves the user's organisation and current entitlements, checks `view_product_results`, and only then queries or serialises product fields. It returns `403` with `{ allowed: false, reason: 'insufficient_tier', requiredPlan: 'premium' }` when the capability is absent. Report download uses an opaque `download_id`, repeats the same organisation and capability check, and returns a short-lived signed object URL. IDs alone never grant access. Denials and downloads are audited.

The gate is not the chart, the tooltip, the table or the PDF. The gate is whether the API returns product-level fields. Everything downstream follows automatically, because a component cannot render data it never received. That is one enforcement point instead of four.

Capabilities are resolved per request from the current subscription, including inherited plans, add-ons, trials and grants, rather than cached in the session. A downgrade therefore takes effect on the next call. The client handles a `403` mid-session by returning to the same locked state it would have shown proactively.

Feature gating answers whether a customer paid for a capability. RBAC and organisation scoping answer whether that user may see a particular resource. Both checks apply. At much larger scale I would cache entitlement resolution briefly with explicit invalidation on subscription changes, but the API response boundary would remain the enforcement point.

### 3. Vetting AI-generated code

1. **Authorisation placed in presentation code.** I look for tier checks scattered through components, missing tenant predicates, and data fetched before a visual gate. The committed rules require components to ask the central capability module, and CI should fail if a tier literal appears outside that module. API integration tests must prove a Basic token receives no product fields and cannot fetch a report by guessing its ID.
2. **Dependency and lockfile defects.** I look for stale or vulnerable packages, incompatible peers, unbounded versions and builds that only work with an existing `node_modules`. This repository exposed a peer conflict, an npm-major lockfile mismatch and an invalid hoisted `picomatch` version. `npm ci` runs with the pinned npm version in a clean CI environment on every change, followed by lint, type checks, tests, the production build and the Docker build.

The constraints are committed in `.cursor/rules/icrt-dashboard.mdc` and `.cursor/rules/implementation-design.mdc`, so the checks applied to generated code are reviewable rather than claims made after the fact. If the dependency surface grew, I would add automated vulnerability scanning and a lockfile update policy.
