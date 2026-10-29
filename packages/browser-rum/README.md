# `@koraitech/browser-rum`

Real User Monitoring for web applications: page views, user actions, resources, long tasks,
errors, Web Vitals and session replay. Data is sent directly to an OpenObserve-compatible
RUM intake.

## Usage

```javascript
import { koraiRum } from '@koraitech/browser-rum'

koraiRum.init({
  applicationId: '<APPLICATION_ID>',
  clientToken: '<RUM_CLIENT_TOKEN>',
  site: '<OBSERVABILITY_HOST>',
  organizationIdentifier: '<ORGANIZATION>',
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
```

**Note**: `trackUserInteractions` collects user clicks. Text of the clicked elements may be
included; use the `data-o2-privacy` attributes or `defaultPrivacyLevel` to mask sensitive content.

## CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@koraitech/browser-rum@<VERSION>/bundle/korai-rum.js"></script>
<script>
  window.KORAI_RUM.init({
    /* same options */
  })
</script>
```

Full setup, intake format and CORS notes: [docs/OPENOBSERVE.md][1].

<!-- Note: all URLs should be absolute -->

[1]: https://github.com/koraitech/browser-sdk/blob/main/docs/OPENOBSERVE.md
