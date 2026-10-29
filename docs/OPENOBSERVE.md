# Sending data to OpenObserve

The SDK posts directly to the OpenObserve RUM ingestion API. No collector or proxy is required.

## Intake URLs

```
https://<site>/rum/<apiVersion>/<organizationIdentifier>/rum      RUM events
https://<site>/rum/<apiVersion>/<organizationIdentifier>/replay   session replay segments
https://<site>/rum/<apiVersion>/<organizationIdentifier>/logs     browser logs
```

`site` is used verbatim as the host (no subdomain is prepended). Every request carries the
client token as the `o2-api-key` query parameter, plus `o2source`, `o2-evp-origin`,
`o2-evp-origin-version` and `o2-request-id`.

| Init option              | Default   | Meaning                                                            |
| ------------------------ | --------- | ------------------------------------------------------------------ |
| `site`                   | n/a       | Host of the OpenObserve instance, e.g. `observability.example.com` |
| `organizationIdentifier` | `default` | Organization the data is ingested into                             |
| `apiVersion`             | `v1`      | Ingestion API version                                              |
| `clientToken`            | n/a       | RUM client token of the organization                               |
| `insecureHTTP`           | `false`   | Use `http://`, for local development only                          |
| `proxy`                  | n/a       | Send through your own endpoint instead (`?o2forward=<path>`)       |

## Client token and application id

In OpenObserve, the Real User Monitoring page under **Ingestion** holds the organization's RUM
token and shows the `applicationId`, `clientToken`,
`site` and `organizationIdentifier` values to paste into `init`. A RUM token can only ingest
RUM data, so it is safe to ship in front-end code.

## CORS and routing

RUM always runs cross-origin, so the instance must:

1. Route `/rum/` to the OpenObserve router. If `/rum/...` falls through to the web UI, the
   browser receives `200 text/html` without CORS headers and reports a misleading CORS error.
2. Answer the preflight `OPTIONS` request and return `Access-Control-Allow-Origin` for
   `POST`. With ingress-nginx this is `enable-cors: "true"`, `cors-allow-methods: "POST, OPTIONS"`
   and `cors-allow-credentials: "false"` on an Ingress that only covers `/rum/`.

## Wire compatibility

To stay compatible with OpenObserve, these tokens are part of the wire format and are not
renamed, even though the public API is:

- event namespace `_o2` and the `o2tags` query parameter;
- `o2-*` intake query parameters;
- `x-openobserve-*` tracing headers (propagator `'openobserve'`, alias of `'datadog'`);
- `data-o2-privacy` / `o2-privacy-*` DOM privacy attributes and classes;
- browser storage keys (`_o2_s_v3` session cookie and friends).

Applications already using `@openobserve/browser-rum` can switch packages without losing
session continuity, because the session cookie is the same. Only the import names change:

| `@openobserve/*`     | This SDK            |
| -------------------- | ------------------- |
| `openobserveRum`     | `koraiRum`          |
| `openobserveLogs`    | `koraiLogs`         |
| `window.O2_RUM`      | `window.KORAI_RUM`  |
| `window.O2_LOGS`     | `window.KORAI_LOGS` |
| `openobserve-rum.js` | `korai-rum.js`      |

## Tracing

`allowedTracingUrls` injects W3C `traceparent` headers by default (128-bit UUIDv7 trace ids), so
backend traces in OpenObserve link to the RUM resource that started them. Remember to allow the
`traceparent` and `tracestate` headers in your backend CORS configuration.

```javascript
koraiRum.init({
  // ...
  allowedTracingUrls: [{ match: 'https://api.example.com', propagatorTypes: ['tracecontext'] }],
})
```

## Script tag setup

```html
<script src="https://cdn.jsdelivr.net/npm/@koraitech/browser-rum@<VERSION>/bundle/korai-rum.js"></script>
<script>
  window.KORAI_RUM &&
    window.KORAI_RUM.init({
      applicationId: '<APPLICATION_ID>',
      clientToken: '<RUM_CLIENT_TOKEN>',
      site: '<OBSERVABILITY_HOST>',
      organizationIdentifier: '<ORGANIZATION>',
      service: 'my-web-app',
      env: 'production',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100,
      trackResources: true,
      trackLongTasks: true,
      trackUserInteractions: true,
    })
</script>
```
