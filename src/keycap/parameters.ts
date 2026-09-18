export type CherryRow = 1 | 2 | 3 | 4

export type KeycapParameters = {
  row: CherryRow
  wallThickness: number
  topThickness: number
  stemShape: 'box' | 'round'
  stemOuterDiameter: number
  stemFitClearance: number
  stemDepth: number
  inlayDepth: number
}

export const cherryRowProfiles: Record<CherryRow, { height: number; tilt: number; label: string }> = {
  1: { height: 9.8, tilt: 0, label: 'R1 · 数字列' },
  2: { height: 7.45, tilt: 2.5, label: 'R2 · Q列' },
  3: { height: 6.55, tilt: 5, label: 'R3 · A列' },
  4: { height: 7.35, tilt: 11.5, label: 'R4 · Z列' },
}

export const defaultKeycapParameters: KeycapParameters = {
  row: 3,
  wallThickness: 1.2,
  topThickness: 1.6,
  stemShape: 'box',
  stemOuterDiameter: 5.37,
  stemFitClearance: 0.1,
  stemDepth: 4,
  inlayDepth: 0.7,
}
