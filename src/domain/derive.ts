import type { StandParameters } from './parameters'

export type BeamChamberProfile = {
  id: string
  label: string
  bayIndex: number
  rowIndex: number
  left: number
  right: number
  bottom: number
  topLeft: number
  topRight: number
  centerX: number
  centerZ: number
  width: number
  minHeight: number
  maxHeight: number
}

export type DerivedDimensions = StandParameters & {
  angleRadians: number
  height: number
  floorLength: number
  beamLength: number
  frontBeamX: number
  rearBeamX: number
  ribCount: number
  ribSpacing: number
  ribPositions: number[]
  bayCount: number
  bayBoundaries: number[]
  bayCenters: number[]
  gridRowCount: number
  gridRowSpacing: number
  gridRowPositions: number[]
  chamberOpeningProfiles: BeamChamberProfile[]
  beamChamberProfiles: BeamChamberProfile[]
  availableBeamChambers: string[]
  frontBeamProfile: BeamChamberProfile
  rearBeamProfile: BeamChamberProfile
}

function deriveChamberProfile(
  input: StandParameters,
  angleRadians: number,
  bayBoundaries: number[],
  gridRowPositions: number[],
  bayIndex: number,
  rowIndex: number,
  clearance: number,
): BeamChamberProfile {
  const bayCount = bayBoundaries.length - 1
  const leftMemberWidth = bayIndex === 0 ? input.frameWidth : input.ribWidth
  const rightMemberWidth = bayIndex === bayCount - 1 ? input.frameWidth : input.ribWidth
  const left = bayBoundaries[bayIndex] + leftMemberWidth / 2 + clearance
  const right = bayBoundaries[bayIndex + 1] - rightMemberWidth / 2 - clearance
  const floorZ = input.frameWidth / 2
  const slopeInset = (input.frameWidth / 2 + clearance) / Math.cos(angleRadians)
  const bottom = rowIndex === 0
    ? input.frameWidth + clearance
    : gridRowPositions[rowIndex - 1] + input.ribWidth / 2 + clearance
  const rowTop = rowIndex < gridRowPositions.length
    ? gridRowPositions[rowIndex] - input.ribWidth / 2 - clearance
    : Number.POSITIVE_INFINITY
  const slopeTopLeft = floorZ + left * Math.tan(angleRadians) - slopeInset
  const slopeTopRight = floorZ + right * Math.tan(angleRadians) - slopeInset
  const topLeft = Math.min(rowTop, slopeTopLeft)
  const topRight = Math.min(rowTop, slopeTopRight)
  const minHeight = topLeft - bottom
  const maxHeight = topRight - bottom

  return {
    id: `${bayIndex}:${rowIndex}`,
    label: `区画 ${bayIndex + 1}・${rowIndex + 1}段目`,
    bayIndex,
    rowIndex,
    left,
    right,
    bottom,
    topLeft,
    topRight,
    centerX: (left + right) / 2,
    centerZ: bottom + (minHeight + maxHeight) / 4,
    width: right - left,
    minHeight,
    maxHeight,
  }
}

export function deriveDimensions(input: StandParameters): DerivedDimensions {
  const angleRadians = (input.angle * Math.PI) / 180
  const slopeLength = input.mode === 'slope'
    ? input.slopeLength
    : input.baseProjection / Math.cos(angleRadians)
  const baseProjection = input.mode === 'slope'
    ? input.slopeLength * Math.cos(angleRadians)
    : input.baseProjection
  const height = slopeLength * Math.sin(angleRadians)
  const safeRibMaxSpacing = Math.max(input.ribMaxSpacing, 1)
  const ribCount = Math.max(2, Math.min(40, Math.ceil(baseProjection / safeRibMaxSpacing) - 1))
  const ribSpacing = baseProjection / (ribCount + 1)
  const ribPositions = Array.from({ length: ribCount }, (_, index) => ribSpacing * (index + 1))
  const bayBoundaries = [0, ...ribPositions, baseProjection]
  const bayCenters = bayBoundaries.slice(0, -1).map((boundary, index) => (
    (boundary + bayBoundaries[index + 1]) / 2
  ))
  const bayCount = bayCenters.length
  const safeGridMaxSpacing = Math.max(input.gridMaxSpacing, 1)
  const gridRowCount = Math.max(1, Math.min(20, Math.ceil(height / safeGridMaxSpacing) - 1))
  const gridRowSpacing = height / (gridRowCount + 1)
  const gridRowPositions = Array.from(
    { length: gridRowCount },
    (_, index) => input.frameWidth / 2 + gridRowSpacing * (index + 1),
  )
  const chamberIndexes = bayCenters.flatMap((_, bayIndex) => (
    Array.from({ length: gridRowCount + 1 }, (_, rowIndex) => ({ bayIndex, rowIndex }))
  ))
  const chamberOpeningProfiles = chamberIndexes.map(({ bayIndex, rowIndex }) => deriveChamberProfile(
    input,
    angleRadians,
    bayBoundaries,
    gridRowPositions,
    bayIndex,
    rowIndex,
    0,
  ))
  const beamChamberProfiles = chamberIndexes.map(({ bayIndex, rowIndex }) => deriveChamberProfile(
    input,
    angleRadians,
    bayBoundaries,
    gridRowPositions,
    bayIndex,
    rowIndex,
    input.fitClearance,
  ))
  const availableProfiles = beamChamberProfiles.filter((profile) => profile.width >= 4 && profile.minHeight >= 4)
  const availableBeamChambers = availableProfiles.map((profile) => profile.id)
  const requestedFront = availableProfiles.find((profile) => profile.id === input.frontBeamChamber)
  const requestedRear = availableProfiles.find((profile) => profile.id === input.rearBeamChamber)
  const frontBeamProfile = requestedFront ?? availableProfiles[0] ?? beamChamberProfiles[0]
  const rearBeamProfile = requestedRear
    ?? availableProfiles.find((profile) => profile.id !== frontBeamProfile.id)
    ?? availableProfiles[0]
    ?? beamChamberProfiles[0]

  return {
    ...input,
    slopeLength,
    baseProjection,
    angleRadians,
    height,
    floorLength: input.frontFootExtra + baseProjection + input.rearFootExtra,
    beamLength: input.standWidth + 2 * input.endProtrusion,
    frontBeamChamber: frontBeamProfile.id,
    rearBeamChamber: rearBeamProfile.id,
    frontBeamX: frontBeamProfile.centerX,
    rearBeamX: rearBeamProfile.centerX,
    ribCount,
    ribSpacing,
    ribPositions,
    bayCount,
    bayBoundaries,
    bayCenters,
    gridRowCount,
    gridRowSpacing,
    gridRowPositions,
    chamberOpeningProfiles,
    beamChamberProfiles,
    availableBeamChambers,
    frontBeamProfile,
    rearBeamProfile,
  }
}
