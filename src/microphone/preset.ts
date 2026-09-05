import { defaultMicrophoneStandParameters, type MicrophoneStandParameters } from './parameters'

export const MICROPHONE_SETTINGS_SCHEMA_VERSION = 3

type MicrophoneSettingsFile = {
  schemaVersion: typeof MICROPHONE_SETTINGS_SCHEMA_VERSION
  product: 'videomic-me-c'
  parameters: MicrophoneStandParameters
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function serializeMicrophoneSettings(parameters: MicrophoneStandParameters): string {
  const settings: MicrophoneSettingsFile = {
    schemaVersion: MICROPHONE_SETTINGS_SCHEMA_VERSION,
    product: 'videomic-me-c',
    parameters,
  }
  return `${JSON.stringify(settings, null, 2)}\n`
}

export function parseMicrophoneSettings(json: string): MicrophoneStandParameters {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('JSONを解析できない')
  }
  if (!isRecord(value)) throw new Error('設定ファイルがオブジェクトではない')
  if (value.schemaVersion !== MICROPHONE_SETTINGS_SCHEMA_VERSION || value.product !== 'videomic-me-c') {
    throw new Error('VideoMic Me-C用の設定ファイルではない')
  }
  if (!isRecord(value.parameters)) throw new Error('parameters がオブジェクトではない')

  const parsed = {} as Record<keyof MicrophoneStandParameters, number>
  for (const key of Object.keys(defaultMicrophoneStandParameters) as Array<keyof MicrophoneStandParameters>) {
    const actual = value.parameters[key]
    if (typeof actual !== 'number' || !Number.isFinite(actual)) {
      throw new Error(`${key} は有限の数値で指定する`)
    }
    parsed[key] = actual
  }
  return parsed as MicrophoneStandParameters
}
