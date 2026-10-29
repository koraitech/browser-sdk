import type { RumInitConfiguration, RumPublicApi } from '@koraitech/browser-rum-core'
import type { LogsInitConfiguration, LogsGlobal } from '@koraitech/browser-logs'
import type { Context } from '@koraitech/browser-core'

declare global {
  interface Window {
    RUM_BUNDLE_URL?: string
    LOGS_BUNDLE_URL?: string
    EXT_RUM_CONFIGURATION?: RumInitConfiguration
    RUM_CONTEXT?: Context
    EXT_LOGS_CONFIGURATION?: LogsInitConfiguration
    LOGS_CONTEXT?: Context
    KORAI_RUM?: RumPublicApi
    KORAI_LOGS?: LogsGlobal
  }
}

function load<T extends 'KORAI_RUM' | 'KORAI_LOGS'>(
  sdk: T,
  url: string,
  initConfig: T extends 'KORAI_RUM' ? RumInitConfiguration : LogsInitConfiguration,
  globalContext?: Context
) {
  const script = document.createElement('script')
  script.src = url
  script.crossOrigin = ''
  script.onload = () => {
    if (!window[sdk]) {
      console.error(`${sdk} is not loaded`)
      return
    }

    window[sdk].init(initConfig as any)
    if (globalContext) {
      window[sdk].setGlobalContext(globalContext)
    }
  }

  document.documentElement.appendChild(script)
}

if (window.RUM_BUNDLE_URL && window.EXT_RUM_CONFIGURATION) {
  load('KORAI_RUM', window.RUM_BUNDLE_URL, window.EXT_RUM_CONFIGURATION, window.RUM_CONTEXT)
}

if (window.LOGS_BUNDLE_URL && window.EXT_LOGS_CONFIGURATION) {
  load('KORAI_LOGS', window.LOGS_BUNDLE_URL, window.EXT_LOGS_CONFIGURATION, window.LOGS_CONTEXT)
}
