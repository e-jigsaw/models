import type { MicrophoneStandParameters } from './parameters'

export const VIDEOMIC_ME_C = {
  length: 73.5,
  bodyDiameter: 20.1,
  envelopeHeight: 25.4,
  weightGrams: 27,
} as const

export type MicrophoneStandDimensions = MicrophoneStandParameters & {
  standHeight: number
  footprintRadius: number
  footRadius: number
  hubHeight: number
  baseSocketBottomZ: number
  holderInnerRadius: number
  holderOuterRadius: number
  holderSocketDepth: number
  mastTopZ: number
}

export function deriveMicrophoneStand(input: MicrophoneStandParameters): MicrophoneStandDimensions {
  const footprintRadius = input.footprintDiameter / 2
  const footRadius = Math.max(13, input.mastDiameter * 0.85)
  const hubHeight = Math.max(28, input.baseHeight + input.mastSocketDepth)
  const baseSocketBottomZ = hubHeight - input.mastSocketDepth
  const holderInnerRadius = VIDEOMIC_ME_C.bodyDiameter / 2 + input.holderClearance
  const holderOuterRadius = holderInnerRadius + input.holderWall
  const holderSocketDepth = 18
  const mastTopZ = baseSocketBottomZ + input.mastLength
  const standHeight = mastTopZ + holderOuterRadius + input.holderLift

  return {
    ...input,
    footprintRadius,
    footRadius,
    hubHeight,
    baseSocketBottomZ,
    holderInnerRadius,
    holderOuterRadius,
    holderSocketDepth,
    mastTopZ,
    standHeight,
  }
}
