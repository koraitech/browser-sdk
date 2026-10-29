# `@koraitech/browser-rum-slim`

Same as [`@koraitech/browser-rum`][1] without session replay recording and the
`compressIntakeRequests` option. Use it when you do not need session replay and want a smaller
bundle. Exposes `koraiRum` and, as a script, `window.KORAI_RUM` (bundle `korai-rum-slim.js`).

Setup: see [`@koraitech/browser-rum`][1] and [docs/OPENOBSERVE.md][2].

<!-- Note: all URLs should be absolute -->

[1]: https://www.npmjs.com/package/@koraitech/browser-rum
[2]: https://github.com/koraitech/browser-sdk/blob/main/docs/OPENOBSERVE.md
