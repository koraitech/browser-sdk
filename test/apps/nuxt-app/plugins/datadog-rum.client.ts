import { koraiRum } from '@koraitech/browser-rum'
import { nuxtRumPlugin } from '@koraitech/browser-rum-nuxt'
import { defineNuxtPlugin, useNuxtApp, useRoute, useRouter } from 'nuxt/app'

export default defineNuxtPlugin({
  name: 'korai-rum',
  enforce: 'pre', // must run before other plugins to capture their startup errors via app:error
  setup() {
    const route = useRoute()
    const rumConfigParam = route.query['rum-config']
    // ex: localhost:3000?rum-config={"applicationId":"123","clientToken":"456", "site": "datadoghq.com"}

    if (rumConfigParam) {
      const raw = Array.isArray(rumConfigParam) ? rumConfigParam[0] : rumConfigParam
      if (raw) {
        const config = JSON.parse(raw)
        koraiRum.init({ ...config, plugins: [nuxtRumPlugin({ router: useRouter(), nuxtApp: useNuxtApp() })] })
      }
    }
  },
})
