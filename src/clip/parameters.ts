export type ClipParameters = {
  monitorThickness: number
  fitClearance: number
  clipWidth: number
  clipHeight: number
  wallThickness: number
  wallAngle: number
  clipBridgeHeight: number
  baseWidth: number
  baseDepth: number
  baseThickness: number
  cornerRadius: number
  edgeInset: number
  printerBedX: number
  printerBedY: number
}

export const defaultClipParameters: ClipParameters = {
  monitorThickness: 30,
  fitClearance: 1,
  clipWidth: 45,
  clipHeight: 28,
  wallThickness: 4,
  wallAngle: 74,
  clipBridgeHeight: 0,
  baseWidth: 80,
  baseDepth: 120,
  baseThickness: 7,
  cornerRadius: 8,
  edgeInset: 120,
  printerBedX: 256,
  printerBedY: 256,
}

export function clipOpening(parameters: ClipParameters): number {
  return parameters.monitorThickness + parameters.fitClearance * 2
}
