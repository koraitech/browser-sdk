import { koraiRum } from '@koraitech/browser-rum'
import { nextjsPlugin } from '@koraitech/browser-rum-nextjs'

const params = new URLSearchParams(window.location.search)
const config = params.get('rum-config')
const context = params.get('rum-context')

if (config && !koraiRum.getInitConfiguration()) {
  koraiRum.init({ ...JSON.parse(config), plugins: [nextjsPlugin()] })
  if (context) {
    koraiRum.setGlobalContext(JSON.parse(context))
  }
}

export { onRouterTransitionStart } from '@koraitech/browser-rum-nextjs'
