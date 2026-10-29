import { koraiLogs } from '@koraitech/browser-logs'
import { koraiRum } from '@koraitech/browser-rum'
import { datadogDebugger } from '@koraitech/browser-debugger'

declare global {
  interface Window {
    LOGS_INIT?: () => void
    RUM_INIT?: () => void
    DEBUGGER_INIT?: () => void
  }
}

if (typeof window !== 'undefined') {
  if (window.LOGS_INIT) {
    window.LOGS_INIT()
  }

  if (window.RUM_INIT) {
    window.RUM_INIT()
  }

  if (window.DEBUGGER_INIT) {
    window.DEBUGGER_INIT()
  }
} else {
  // compat test
  koraiLogs.init({ clientToken: 'xxx', beforeSend: undefined })
  koraiRum.init({ clientToken: 'xxx', applicationId: 'xxx', beforeSend: undefined })
  koraiRum.setUser({ id: undefined })
  datadogDebugger.init({ clientToken: 'xxx', service: 'xxx' })
}
