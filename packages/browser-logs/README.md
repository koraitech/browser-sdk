# `@koraitech/browser-logs`

Send logs from web pages to an OpenObserve-compatible RUM intake.

## Usage

```javascript
import { koraiLogs } from '@koraitech/browser-logs'

koraiLogs.init({
  clientToken: '<RUM_CLIENT_TOKEN>',
  site: '<OBSERVABILITY_HOST>',
  organizationIdentifier: '<ORGANIZATION>',
  service: 'my-web-app',
  env: 'production',
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
})

koraiLogs.logger.info('Button clicked', { name: 'buttonName', id: 123 })

try {
  // ...
} catch (error) {
  koraiLogs.logger.error('Error occurred', { team: 'myTeam' }, error)
}
```

## CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@koraitech/browser-logs@<VERSION>/bundle/korai-logs.js"></script>
<script>
  window.KORAI_LOGS.init({
    /* same options */
  })
</script>
```

Full setup, intake format and CORS notes: [docs/OPENOBSERVE.md][1].

<!-- Note: all URLs should be absolute -->

[1]: https://github.com/koraitech/browser-sdk/blob/main/docs/OPENOBSERVE.md
