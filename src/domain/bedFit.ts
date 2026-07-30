export type BedFitResult = {
  fits: boolean
  angle: number
  projectedX: number
  projectedY: number
}

export function findRotatedRectangleFit(
  partX: number,
  partY: number,
  bedX: number,
  bedY: number,
): BedFitResult {
  if ([partX, partY, bedX, bedY].some((value) => !Number.isFinite(value) || value <= 0)) {
    return { fits: false, angle: 0, projectedX: partX, projectedY: partY }
  }

  let best: BedFitResult = {
    fits: false,
    angle: 0,
    projectedX: partX,
    projectedY: partY,
  }
  let bestScale = Number.POSITIVE_INFINITY

  for (let step = 0; step <= 900; step += 1) {
    const angle = step / 10
    const radians = angle * Math.PI / 180
    const projectedX = partX * Math.cos(radians) + partY * Math.sin(radians)
    const projectedY = partX * Math.sin(radians) + partY * Math.cos(radians)
    const scale = Math.max(projectedX / bedX, projectedY / bedY)

    if (scale < bestScale) {
      bestScale = scale
      best = {
        fits: projectedX <= bedX + 0.01 && projectedY <= bedY + 0.01,
        angle,
        projectedX,
        projectedY,
      }
    }
  }

  return best
}
