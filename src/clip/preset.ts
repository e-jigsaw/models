import { defaultClipParameters, type ClipParameters } from './parameters'

export const CLIP_SETTINGS_SCHEMA_VERSION = 4

export type ClipSettingsFile = {
  schemaVersion: typeof CLIP_SETTINGS_SCHEMA_VERSION
  parameters: ClipParameters
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseClipParameters(value: unknown, schemaVersion: 1 | 2 | 3 | 4): ClipParameters {
  if (!isRecord(value)) throw new Error('parameters がオブジェクトではない')

  const parsed = {} as Record<keyof ClipParameters, number>
  for (const key of Object.keys(defaultClipParameters) as Array<keyof ClipParameters>) {
    const actual = value[key]
    if (schemaVersion === 1 && key === 'wallAngle' && actual === undefined) {
      parsed[key] = defaultClipParameters.wallAngle
      continue
    }
    if (key === 'clipBridgeHeight' && schemaVersion <= 3 && actual === undefined) {
      if (schemaVersion <= 2) {
        parsed[key] = 0
        continue
      }
      const legacyFloorThickness = value.clipFloorThickness
      const legacyBaseThickness = value.baseThickness
      if (typeof legacyFloorThickness !== 'number' || !Number.isFinite(legacyFloorThickness)) {
        throw new Error('clipFloorThickness は有限の数値で指定する')
      }
      if (typeof legacyBaseThickness !== 'number' || !Number.isFinite(legacyBaseThickness)) {
        throw new Error('baseThickness は有限の数値で指定する')
      }
      parsed[key] = Math.max(0, legacyFloorThickness - legacyBaseThickness)
      continue
    }
    if (typeof actual !== 'number' || !Number.isFinite(actual)) {
      throw new Error(`${key} は有限の数値で指定する`)
    }
    parsed[key] = actual
  }
  return parsed
}

export function serializeClipSettings(parameters: ClipParameters): string {
  const settings: ClipSettingsFile = {
    schemaVersion: CLIP_SETTINGS_SCHEMA_VERSION,
    parameters,
  }
  return `${JSON.stringify(settings, null, 2)}\n`
}

export function parseClipSettings(json: string): ClipParameters {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('JSONを解析できない')
  }
  if (!isRecord(value)) throw new Error('設定ファイルがオブジェクトではない')
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2 && value.schemaVersion !== 3 && value.schemaVersion !== CLIP_SETTINGS_SCHEMA_VERSION) {
    throw new Error(`未対応のschemaVersion: ${String(value.schemaVersion)}`)
  }
  return parseClipParameters(value.parameters, value.schemaVersion)
}
