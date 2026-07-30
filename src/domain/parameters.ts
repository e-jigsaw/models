export type DimensionMode = 'slope' | 'footprint'

export type StandParameters = {
  mode: DimensionMode
  slopeLength: number
  baseProjection: number
  angle: number
  standWidth: number
  legThickness: number
  frameWidth: number
  ribWidth: number
  ribMaxSpacing: number
  gridMaxSpacing: number
  frontBeamChamber: string
  rearBeamChamber: string
  lipHeight: number
  frontFootExtra: number
  rearFootExtra: number
  endProtrusion: number
  fitClearance: number
  retentionHoleDiameter: number
  printerBedX: number
  printerBedY: number
}

export const defaultParameters: StandParameters = {
  mode: 'slope',
  slopeLength: 220,
  baseProjection: 209,
  angle: 18,
  standWidth: 360,
  legThickness: 14,
  frameWidth: 22,
  ribWidth: 8,
  ribMaxSpacing: 55,
  gridMaxSpacing: 40,
  frontBeamChamber: '2:0',
  rearBeamChamber: '3:0',
  lipHeight: 22,
  frontFootExtra: 12,
  rearFootExtra: 20,
  endProtrusion: 8,
  fitClearance: 0.25,
  retentionHoleDiameter: 3.4,
  printerBedX: 256,
  printerBedY: 256,
}
