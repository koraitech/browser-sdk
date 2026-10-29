import { noop } from '@koraitech/browser-core'
import type { ProfilerApi } from '@koraitech/browser-rum-core'

export const noopProfilerApi: ProfilerApi = {
  stop: noop,
  onRumStart: noop,
}
