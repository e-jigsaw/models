import { defaultParameters, type StandParameters } from '../domain/parameters'

export const SETTINGS_SCHEMA_VERSION = 1

export type SettingsFile = {
  schemaVersion: typeof SETTINGS_SCHEMA_VERSION
  parameters: StandParameters
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseParameters(value: unknown): StandParameters {
  if (!isRecord(value)) throw new Error('parameters がオブジェクトではない')

  const parsed = {} as Record<keyof StandParameters, StandParameters[keyof StandParameters]>
  for (const key of Object.keys(defaultParameters) as Array<keyof StandParameters>) {
    const expected = defaultParameters[key]
    const actual = value[key]

    if (typeof expected === 'number') {
      if (typeof actual !== 'number' || !Number.isFinite(actual)) {
        throw new Error(`${key} は有限の数値で指定する`)
      }
    } else if (typeof actual !== 'string' || actual.length === 0) {
      throw new Error(`${key} は文字列で指定する`)
    }
    parsed[key] = actual as StandParameters[keyof StandParameters]
  }

  if (parsed.mode !== 'slope' && parsed.mode !== 'footprint') {
    throw new Error('mode は slope または footprint にする')
  }
  return parsed as StandParameters
}

export function serializeSettings(parameters: StandParameters): string {
  const settings: SettingsFile = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    parameters,
  }
  return `${JSON.stringify(settings, null, 2)}\n`
}

export function parseSettings(json: string): StandParameters {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('JSONを解析できない')
  }
  if (!isRecord(value)) throw new Error('設定ファイルがオブジェクトではない')
  if (value.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    throw new Error(`未対応のschemaVersion: ${String(value.schemaVersion)}`)
  }
  return parseParameters(value.parameters)
}
