import type { DatadogLogs } from '@koraitech/browser-logs'
import type { DatadogDebugger } from '@koraitech/browser-debugger'
import type { DatadogRum } from '@koraitech/browser-rum'

declare global {
  interface Window {
    KORAI_LOGS?: DatadogLogs
    KORAI_RUM?: DatadogRum
    DD_DEBUGGER?: DatadogDebugger
    DD_SOURCE_CODE_CONTEXT?: { [stack: string]: { service: string; version?: string } }
  }
}
