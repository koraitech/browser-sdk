# Changelog

## 0.1.1

Bug fixes ported from Datadog browser-sdk (the OpenObserve base is unchanged, so the wire format
is the same as 0.1.0).

- `site` is now required unless `proxy` is set. Before, an omitted `site` silently sent data to
  `datadoghq.com`; now the SDK logs `Site is not configured` and sends nothing.
- Don't break SDK init when `document.cookie` is not accessible (sandboxed iframes without
  `allow-same-origin`): the session falls back to the next `sessionPersistence` option
  (DataDog/browser-sdk#5178).
- Send oversized page-exit batches as several beacons instead of a `fetch` that the page unload
  can cancel (DataDog/browser-sdk#5218).
- Guard against null or missing browser APIs: `fetch` overrides resolving without a `Response`,
  `navigator.connection`, the native bridge allowed hosts, a replaced global `History`,
  `PerformanceObserver.supportedEntryTypes` and `window.visualViewport`
  (DataDog/browser-sdk#5246).

## 0.1.0

First release.

- Based on openobserve/browser-sdk 0.4.3 (Datadog browser-sdk v7.4.0).
- Packages published under the `@korai` scope: `browser-rum`, `browser-rum-slim`,
  `browser-logs` and their internal dependencies.
- Public API renamed to `koraiRum`, `koraiLogs`, `window.KORAI_RUM`, `window.KORAI_LOGS`, bundles
  `korai-rum.js`, `korai-rum-slim.js`, `korai-logs.js`. The wire format is unchanged, so data
  is ingested by OpenObserve exactly as from `@openobserve/browser-rum` 0.4.3.
