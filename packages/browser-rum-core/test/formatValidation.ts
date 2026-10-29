import Ajv from 'ajv'
import { registerCleanupTask } from '@koraitech/browser-core/test'
import type { Context } from '@koraitech/browser-core'
import { combine } from '@koraitech/js-core/util'
import type { CommonProperties } from '@koraitech/browser-rum-core'
import type { LifeCycle, RawRumEventCollectedData } from '../src/domain/lifeCycle'
import { LifeCycleEventType } from '../src/domain/lifeCycle'
import type { RawRumEvent } from '../src/rawRumEvent.types'
import { allJsonSchemas } from './allJsonSchemas'

export function collectAndValidateRawRumEvents(lifeCycle: LifeCycle) {
  const rawRumEvents: Array<RawRumEventCollectedData<RawRumEvent>> = []
  const subscription = lifeCycle.subscribe(LifeCycleEventType.RAW_RUM_EVENT_COLLECTED, (data) => {
    rawRumEvents.push(data)
    validateRumEventFormat(data.rawRumEvent)
  })
  registerCleanupTask(() => {
    subscription.unsubscribe()
  })

  return rawRumEvents
}

function validateRumEventFormat(rawRumEvent: RawRumEvent) {
  const fakeId = '00000000-aaaa-0000-aaaa-000000000000'
  const fakeContext: Partial<CommonProperties> = {
    _o2: {
      format_version: 2,
      drift: 0,
      configuration: {
        session_sample_rate: 40,
        session_replay_sample_rate: 60,
        profiling_sample_rate: 0,
      },
    },
    application: {
      id: fakeId,
    },
    date: 0,
    source: 'browser',
    session: {
      id: fakeId,
      type: 'user',
    },
    view: {
      id: fakeId,
      referrer: '',
      url: 'fake url',
    },
    connectivity: {
      status: 'connected',
      interfaces: ['wifi'],
      effective_type: '4g',
    },
    context: {},
  }
  validateRumFormat(combine(fakeContext as CommonProperties & Context, rawRumEvent))
}

let getAjvCache: Ajv | undefined
function getAjv() {
  if (!getAjvCache) {
    getAjvCache = new Ajv({
      allErrors: true,
    })
    getAjvCache.addSchema(allJsonSchemas.map(withHexSpanIds))
  }
  return getAjvCache
}

const SPAN_ID_PATTERN = '^([0-9]+|[0-9a-f]{16})$'

/**
 * The SDK serializes span ids as 16-char hex (what the OpenObserve backend expects), while the
 * pinned rum-events-format schema still only describes the decimal form.
 */
function withHexSpanIds(schema: object): object {
  const traceSchema = schema as { $id?: string; properties?: Record<string, { pattern?: string }> }
  if (traceSchema.$id !== 'rum/_trace-schema.json' || !traceSchema.properties) {
    return schema
  }
  const properties = { ...traceSchema.properties }
  for (const key of ['span_id', 'parent_span_id']) {
    if (properties[key]) {
      properties[key] = { ...properties[key], pattern: SPAN_ID_PATTERN }
    }
  }
  return { ...traceSchema, properties }
}

function validateRumFormat(rumEvent: Context) {
  const instance = getAjv()
  void instance.validate('rum-events-schema.json', rumEvent)

  if (instance.errors) {
    const errors = instance.errors
      .map((error) => {
        let message = error.message
        if (error.keyword === 'const') {
          message += ` ${formatAllowedValues([error.params.allowedValue])}`
        }
        if (error.keyword === 'enum') {
          message += ` ${formatAllowedValues(error.params.allowedValues)}`
        }
        if (error.keyword === 'additionalProperties') {
          message += ` ${formatAllowedValues([error.params.additionalProperty])}`
        }
        return `  event${error.instancePath || ''} ${message}`
      })
      .join('\n')
    fail(`Invalid RUM event format:\n${errors}`)
  }
}

function formatAllowedValues(allowedValues: string[]) {
  return allowedValues.map((v) => `'${v}'`).join(', ')
}
