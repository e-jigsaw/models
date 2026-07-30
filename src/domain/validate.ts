import { measurements } from '@jscad/modeling'
import { createBeam, createLeg, type JscadGeometry } from '../geometry/model'
import { findRotatedRectangleFit } from './bedFit'
import type { DerivedDimensions } from './derive'

const { measureBoundingBox } = measurements

export type ValidationMessage = {
  level: 'error' | 'warning'
  message: string
}

function geometrySize(geometry: JscadGeometry): [number, number, number] {
  const [minimum, maximum] = measureBoundingBox(geometry)
  return [
    maximum[0] - minimum[0],
    maximum[1] - minimum[1],
    maximum[2] - minimum[2],
  ]
}

function bedWarning(
  label: string,
  partX: number,
  partY: number,
  bedX: number,
  bedY: number,
): ValidationMessage | undefined {
  if (findRotatedRectangleFit(partX, partY, bedX, bedY).fits) return undefined
  return {
    level: 'warning',
    message: `${label}の造形面 ${partX.toFixed(0)}×${partY.toFixed(0)} mm は ${bedX.toFixed(0)}×${bedY.toFixed(0)} mm に回転配置しても収まらない`,
  }
}

export function validateDimensions(d: DerivedDimensions): ValidationMessage[] {
  const messages: ValidationMessage[] = []
  if (d.angle <= 0 || d.angle >= 60) {
    messages.push({ level: 'error', message: '傾斜角は 0° より大きく 60° 未満にする' })
  }
  if (d.slopeLength <= 0 || d.baseProjection <= 0 || d.height <= 0) {
    messages.push({ level: 'error', message: '算出寸法が正の値になっていない' })
  }
  if (d.ribMaxSpacing <= 0 || d.ribWidth <= 0) {
    messages.push({ level: 'error', message: '柱の幅と最大間隔は正の値にする' })
  }
  if (d.ribWidth < 3.2) {
    messages.push({ level: 'error', message: '格子材の幅は 3.2 mm 以上にする' })
  }
  if (d.ribSpacing > d.ribMaxSpacing + 0.01) {
    messages.push({ level: 'warning', message: `柱数上限により実際の柱間隔が ${d.ribSpacing.toFixed(1)} mm になっている` })
  }
  if (d.gridMaxSpacing <= 0) {
    messages.push({ level: 'error', message: '横桟の最大間隔は正の値にする' })
  }
  if (d.frontBeamChamber === d.rearBeamChamber) {
    messages.push({ level: 'error', message: '前梁と後梁は別の格子チャンバーを選ぶ' })
  }
  for (const [label, profile] of [['前梁', d.frontBeamProfile], ['後梁', d.rearBeamProfile]] as const) {
    if (!d.availableBeamChambers.includes(profile.id)) {
      messages.push({ level: 'error', message: `${label}のチャンバーは小さすぎて梁を生成できない` })
    }
  }
  if (!messages.some((message) => message.level === 'error')) {
    const [legX, , legZ] = geometrySize(createLeg(d))
    const [frontX, frontY, frontZ] = geometrySize(createBeam(d, d.frontBeamChamber))
    const [rearX, rearY, rearZ] = geometrySize(createBeam(d, d.rearBeamChamber))
    const warnings = [
      bedWarning('脚', legX, legZ, d.printerBedX, d.printerBedY),
      bedWarning('前梁', frontY, Math.min(frontX, frontZ), d.printerBedX, d.printerBedY),
      bedWarning('後梁', rearY, Math.min(rearX, rearZ), d.printerBedX, d.printerBedY),
    ].filter((message): message is ValidationMessage => message !== undefined)
    messages.push(...warnings)
  }
  if (d.fitClearance < 0.15 || d.fitClearance > 0.5) {
    messages.push({ level: 'warning', message: '嵌合クリアランスは通常 0.15–0.50 mm/片側の範囲で調整する' })
  }
  return messages
}
