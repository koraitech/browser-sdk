import { koraiRum } from '@koraitech/browser-rum'
import { koraiLogs } from '@koraitech/browser-logs'
import { DEFAULT_PANEL_TAB } from '../common/panelTabConstants'
import { BASE_MONITORING_CONFIG, RUM_CONFIG } from '../common/monitoringConfig'

export function initMonitoring() {
  koraiRum.init(RUM_CONFIG)
  koraiRum.startSessionReplayRecording()
  koraiRum.startView(DEFAULT_PANEL_TAB)

  koraiLogs.init(BASE_MONITORING_CONFIG)
}
