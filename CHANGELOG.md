# Changelog

## 0.1.0

First release.

- Based on openobserve/browser-sdk 0.4.3 (Datadog browser-sdk v7.4.0).
- Packages published under the `@korai` scope: `browser-rum`, `browser-rum-slim`,
  `browser-logs` and their internal dependencies.
- Public API renamed to `koraiRum`, `koraiLogs`, `window.KORAI_RUM`, `window.KORAI_LOGS`, bundles
  `korai-rum.js`, `korai-rum-slim.js`, `korai-logs.js`. The wire format is unchanged, so data
  is ingested by OpenObserve exactly as from `@openobserve/browser-rum` 0.4.3.
