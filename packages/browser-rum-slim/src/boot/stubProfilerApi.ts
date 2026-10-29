import { noop } from '@koraitech/browser-core'
import type { ProfilerApi } from '@koraitech/browser-rum-core'

export function makeProfilerApiStub(): ProfilerApi {
  return {
    onRumStart: noop,
    stop: noop,
  }
}
