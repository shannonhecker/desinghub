# Builder authentication and shared-content boundary

QA item 3 depends on the Next.js/proxy upgrade in PR #412. It does not deploy Firestore rules.

- Login issues an independently random, signed one-hour session. Proxy and model routes use the same verifier and native constant-time signature comparison. Legacy password-hash cookies no longer authenticate; users sign in again. Rotate `STAGING_TOKEN_SECRET` to revoke all sessions.
- `STAGING_PASSWORD` controls the UI gate only. Model routes always require a valid signed session, even when the UI is public. Forwarded-IP headers no longer grant authenticated access.
- Login and paid model calls require Redis (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, or the existing KV aliases). Missing configuration and Redis outages deny requests. Login has a 20/minute IP limit and 200/minute global limit. Model routes retain 20/minute per-route IP limits and share a 1,000-request sliding daily budget; `MODEL_DAILY_REQUEST_LIMIT` can set a positive integer up to 100,000. This is a request cap, not a dollar cap; use the provider's billing limits too.
- Request bodies are bounded while streaming: 4 KiB for login and 512 KiB for model routes. Malformed/null JSON returns 400, oversize returns 413. Upstream exception details stay in server logs; the browser receives a generic error.
- AI action themes/components/colors are validated against the current registry; layout sizes, gaps, padding and grid spans are bounded. Invalid actions are reported as skipped.
- Shared image `src` props accept packaged root-relative assets and raster image data only. External/protocol-relative/blob sources and SVG data are removed. The shared preview's CSP also limits `img-src` to self and data; normal editor images retain their existing policy.
- Firestore writes now validate exact project/snapshot schemas, field types and enums, and pin both owner UID and creation timestamp. Aggregate size uses Firestore’s native 1 MiB document cap. Existing editor-generated message/block lists and long project names remain intact; no new arbitrary cardinality cap silently stops autosave. Per-user document-count quotas require a trusted backend and are not claimed by these rules.

## Validation limits before deployment

The local machine has neither Firebase CLI nor a Java runtime, so Firestore emulator execution is unavailable. Before approving a rules deployment, verify: owner create/read/update/delete succeeds; unauthenticated/cross-owner writes fail; changing UID/createdAt fails; unknown fields, invalid enums, documents exceeding the native 1 MiB limit and malformed snapshots fail; legacy valid snapshots (including 201+ messages, 121+ blocks and names over 120 characters) still save without truncation. Rules have not been deployed.
