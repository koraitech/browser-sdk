/**
 *
 * Datadog Browser Logs SDK for collecting and forwarding browser logs to Datadog.
 * Provides comprehensive logging capabilities with automatic error tracking and custom log collection.
 *
 * @packageDocumentation
 * @see [Browser Log Collection](https://docs.datadoghq.com/logs/log_collection/javascript/)
 */

import { defineGlobal, globalObject } from '@koraitech/browser-core'
import type { LogsPublicApi } from '../boot/logsPublicApi'
import { makeLogsPublicApi } from '../boot/logsPublicApi'

export type { InternalContext } from '../domain/contexts/internalContext'
export type { LogsMessage } from '../domain/logger'
export { Logger, HandlerType } from '../domain/logger'
export { StatusType } from '../domain/logger/isAuthorized'
export type { LoggerConfiguration, LogsPublicApi as DatadogLogs } from '../boot/logsPublicApi'
export type { LogsInitConfiguration, LogsBeforeSend } from '../domain/configuration'
export type { LogsEvent } from '../logsEvent.types'
export type {
  LogsEventDomainContext,
  NetworkLogsEventDomainContext,
  ConsoleLogsEventDomainContext,
  LoggerLogsEventDomainContext,
} from '../domainContext.types'

/**
 * @deprecated Use {@link DatadogLogs} instead
 */
export type LogsGlobal = LogsPublicApi

export type {
  InitConfiguration,
  PublicApi,
  Context,
  ContextValue,
  ContextArray,
  User,
  Account,
  TraceContextInjection,
  SessionPersistence,
  TrackingConsent,
  MatchOption,
  ProxyFn,
  Site,
  RawReportType,
  ErrorSource,
} from '@koraitech/browser-core'
export type { ConsoleApiName } from '@koraitech/js-core/util'

/**
 * The global Logs instance. Use this to call Logs methods.
 *
 * @category Main
 * @see {@link DatadogLogs}
 * @see [Browser Log Collection](https://docs.datadoghq.com/logs/log_collection/javascript/)
 */
export const koraiLogs = makeLogsPublicApi()

interface BrowserWindow {
  KORAI_LOGS?: LogsPublicApi
}
defineGlobal(globalObject as BrowserWindow, 'KORAI_LOGS', koraiLogs)
