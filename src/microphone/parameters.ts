export type MicrophoneStandParameters = {
  mastLength: number
  footprintDiameter: number
  baseHeight: number
  hubDiameter: number
  mastDiameter: number
  mastSocketDepth: number
  fitClearance: number
  holderClearance: number
  holderWall: number
  holderLength: number
  holderForwardOffset: number
  holderLift: number
  tiltAngle: number
  cableDiameter: number
  printerBedX: number
  printerBedY: number
  printerBedZ: number
}

export const defaultMicrophoneStandParameters: MicrophoneStandParameters = {
  mastLength: 325,
  footprintDiameter: 240,
  baseHeight: 10,
  hubDiameter: 36,
  mastDiameter: 18,
  mastSocketDepth: 20,
  fitClearance: 0.25,
  holderClearance: 0.45,
  holderWall: 3,
  holderLength: 18,
  holderForwardOffset: 0,
  holderLift: 28,
  tiltAngle: 12,
  cableDiameter: 5,
  printerBedX: 256,
  printerBedY: 256,
  printerBedZ: 325,
}
