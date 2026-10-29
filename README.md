# Korai Browser SDK

Real User Monitoring (RUM), session replay and log collection for web applications.

The SDK speaks the OpenObserve RUM ingestion API, so it can send data straight to any
OpenObserve instance without a collector in between.

## Packages

| Package                                                    | Description                                  |
| ---------------------------------------------------------- | -------------------------------------------- |
| [`@koraitech/browser-rum`](packages/browser-rum)           | RUM with session replay                      |
| [`@koraitech/browser-rum-slim`](packages/browser-rum-slim) | RUM without session replay (smaller bundle)  |
| [`@koraitech/browser-logs`](packages/browser-logs)         | Browser log collection                       |
| [`@koraitech/browser-rum-core`](packages/browser-rum-core) | Core RUM functionality (internal)            |
| [`@koraitech/browser-core`](packages/browser-core)         | Shared browser utilities (internal)          |
| [`@koraitech/browser-worker`](packages/browser-worker)     | Session replay compression worker (internal) |
| [`@koraitech/js-core`](packages/js-core)                   | Shared JavaScript utilities (internal)       |

## Installation

```bash
npm install @koraitech/browser-rum @koraitech/browser-logs
```

## Quick start

```javascript
import { koraiRum } from '@koraitech/browser-rum'
import { koraiLogs } from '@koraitech/browser-logs'

const transport = {
  clientToken: '<RUM_CLIENT_TOKEN>',
  site: '<OBSERVABILITY_HOST>', // host only, e.g. observability.example.com
  organizationIdentifier: '<ORGANIZATION>',
  apiVersion: 'v1',
}

koraiRum.init({
  ...transport,
  applicationId: '<APPLICATION_ID>',
  service: 'my-web-app',
  env: 'production',
  version: '1.0.0',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  trackResources: true,
  trackLongTasks: true,
  trackUserInteractions: true,
  defaultPrivacyLevel: 'mask-user-input',
})

koraiLogs.init({ ...transport, service: 'my-web-app', env: 'production', forwardErrorsToLogs: true })
koraiLogs.logger.info('app started')
```

See [docs/OPENOBSERVE.md](docs/OPENOBSERVE.md) for the intake URL format, how to get a client
token, CORS requirements, tracing headers and a CDN-style `<script>` setup.

## CDN bundles

Each release attaches the browser bundles (`korai-rum.js`, `korai-rum-slim.js`,
`korai-logs.js`) to its GitHub release. They are also available from any npm CDN, for example:

```html
<script src="https://cdn.jsdelivr.net/npm/@koraitech/browser-rum@<VERSION>/bundle/korai-rum.js"></script>
<script>
  window.KORAI_RUM.init({
    /* same options as above */
  })
</script>
```

## Development

```bash
yarn install
yarn build
yarn typecheck
yarn lint
yarn test:unit
```

Node and Yarn versions are pinned in `package.json` (`volta`). More in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

Releases are published to npm from GitHub Actions; see [docs/RELEASING.md](docs/RELEASING.md).

## Upstream

This repository is generated from [openobserve/browser-sdk](https://github.com/openobserve/browser-sdk),
itself a fork of [DataDog/browser-sdk](https://github.com/DataDog/browser-sdk). The sync and
rebrand tooling lives in [`scripts/fork`](scripts/fork) and is described in
[docs/UPSTREAM.md](docs/UPSTREAM.md).

## License

Apache License 2.0, see [LICENSE](LICENSE) and [NOTICE](NOTICE).

This project includes software developed at Datadog (https://www.datadoghq.com/), with
modifications by OpenObserve, Inc. and by the maintainers of this repository.
