import type { ServerDuration } from '@koraitech/js-core/time'
import { isNumber } from '@koraitech/browser-core'

export function discardNegativeDuration(duration: ServerDuration | undefined): ServerDuration | undefined {
  return isNumber(duration) && duration < 0 ? undefined : duration
}
