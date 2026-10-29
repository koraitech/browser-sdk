import { koraiRum } from '@koraitech/browser-rum'
import { koraiLogs } from '@koraitech/browser-logs'
import type { RumInitConfiguration } from '@koraitech/browser-rum-core'
import type { LogsInitConfiguration } from '@koraitech/browser-logs'
import type { Context } from '@koraitech/browser-core'

declare global {
  interface Window {
    EXT_RUM_CONFIGURATION?: RumInitConfiguration
    RUM_CONTEXT?: Context
    EXT_LOGS_CONFIGURATION?: LogsInitConfiguration
    LOGS_CONTEXT?: Context
  }
}

if (window.EXT_RUM_CONFIGURATION) {
  koraiRum.init(window.EXT_RUM_CONFIGURATION)

  if (window.RUM_CONTEXT) {
    koraiRum.setGlobalContext(window.RUM_CONTEXT)
  }
}

if (window.EXT_LOGS_CONFIGURATION) {
  koraiLogs.init(window.EXT_LOGS_CONFIGURATION)

  if (window.LOGS_CONTEXT) {
    koraiLogs.setGlobalContext(window.LOGS_CONTEXT)
  }
}
