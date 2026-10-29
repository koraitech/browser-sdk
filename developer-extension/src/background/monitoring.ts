import { koraiLogs } from '@koraitech/browser-logs'
import { BASE_MONITORING_CONFIG } from '../common/monitoringConfig'

// Initialize Datadog logs for service worker
koraiLogs.init(BASE_MONITORING_CONFIG)

// Add context to distinguish background logs from panel logs
koraiLogs.setGlobalContext({
  context: 'background',
})
