import { noop } from '@koraitech/browser-core'
import type { RecorderApi } from '@koraitech/browser-rum-core'

export const noopRecorderApi: RecorderApi = {
  start: noop,
  stop: noop,
  isRecording: () => false,
  onRumStart: noop,
  getReplayStats: () => undefined,
  getSessionReplayLink: () => undefined,
}
