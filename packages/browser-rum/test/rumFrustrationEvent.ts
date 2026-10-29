import { clocksNow, timeStampNow } from '@koraitech/js-core/time'
import type { RawRumActionEvent, RawRumEventCollectedData } from '@koraitech/browser-rum-core'
import { ActionType, FrustrationType, RumEventType } from '@koraitech/browser-rum-core'

export function createRumFrustrationEvent(mouseEvent: MouseEvent): RawRumEventCollectedData<RawRumActionEvent> {
  return {
    startClocks: clocksNow(),
    rawRumEvent: {
      date: timeStampNow(),
      type: RumEventType.ACTION,
      action: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: ActionType.CLICK,
        frustration: {
          type: [FrustrationType.DEAD_CLICK],
        },
        target: {
          name: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
    domainContext: { events: [mouseEvent] },
  }
}
