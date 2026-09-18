import { defaultKeycapParameters, type KeycapParameters } from './parameters'

export function serializeKeycapSettings(parameters: KeycapParameters) {
  return JSON.stringify({ schemaVersion: 1, product: 'cherry-keycap', parameters }, null, 2)
}

export function parseKeycapSettings(raw: string): KeycapParameters {
  const parsed = JSON.parse(raw) as { schemaVersion?: unknown; product?: unknown; parameters?: Partial<KeycapParameters> }
  if (parsed.schemaVersion !== 1 || parsed.product !== 'cherry-keycap' || !parsed.parameters) {
    throw new Error('Cherryキーキャップ設定ファイルではない')
  }
  const next = { ...defaultKeycapParameters, ...parsed.parameters }
  // Files saved before stemShape was introduced used a round stem.
  next.stemShape = parsed.parameters.stemShape ?? 'round'
  if (!['box', 'round'].includes(next.stemShape)) throw new Error('ステム形状が不正')
  if (![1, 2, 3, 4].includes(next.row)) throw new Error('row は 1〜4 にする')
  for (const [name, value] of Object.entries(next)) {
    if (name !== 'row' && name !== 'stemShape' && !Number.isFinite(value)) throw new Error(`${name} は数値にする`)
  }
  return next
}
