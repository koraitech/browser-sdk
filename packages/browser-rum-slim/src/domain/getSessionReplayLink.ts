import type { RumConfiguration } from '@koraitech/browser-rum-core'
import { getSessionReplayUrl } from '@koraitech/browser-rum-core'

export function getSessionReplayLink(configuration: RumConfiguration): string | undefined {
  return getSessionReplayUrl(configuration, { errorType: 'slim-package' })
}
