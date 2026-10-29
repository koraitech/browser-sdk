import type { RelativeTime } from '@koraitech/js-core/time'
import type { TelemetryEvent } from '@koraitech/browser-core'
import { createHook } from '@koraitech/js-core/assembly'
import type { Hook } from '@koraitech/js-core/assembly'
import type { RecursivePartial } from '@koraitech/js-core/util'
import type { LogsEvent } from '../logsEvent.types'

export type DefaultLogsEventAttributes = RecursivePartial<LogsEvent>
export type DefaultTelemetryEventAttributes = RecursivePartial<TelemetryEvent>

export type AssembleHook = Hook<{ startTime: RelativeTime }, DefaultLogsEventAttributes>
export type AssembleTelemetryHook = Hook<{ startTime: RelativeTime }, DefaultTelemetryEventAttributes>

export interface Hooks {
  assemble: AssembleHook
  assembleTelemetry: AssembleTelemetryHook
}

export function createHooks(): Hooks {
  return {
    assemble: createHook(),
    assembleTelemetry: createHook(),
  }
}
