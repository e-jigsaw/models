import { measurements } from '@jscad/modeling'
import { findRotatedRectangleFit } from '../domain/bedFit'
import type { JscadGeometry } from '../geometry/model'
import type { ValidationMessage } from '../domain/validate'
import { VIDEOMIC_ME_C, type MicrophoneStandDimensions } from './derive'
import { createMicrophoneBase, createMicrophoneHolder } from './model'

const { measureBoundingBox } = measurements

function geometrySize(geometry: JscadGeometry): [number, number, number] {
  const [minimum, maximum] = measureBoundingBox(geometry)
  return [maximum[0] - minimum[0], maximum[1] - minimum[1], maximum[2] - minimum[2]]
}

export function validateMicrophoneStand(d: MicrophoneStandDimensions): ValidationMessage[] {
  const messages: ValidationMessage[] = []
  if (d.standHeight < 300 || d.standHeight > 400) {
    messages.push({ level: 'error', message: 'マイク中心高は300〜400 mmにする' })
  }
  if (d.mastLength <= 0) {
    messages.push({ level: 'error', message: '支柱長は正の値にする' })
  } else if (d.mastLength > d.printerBedZ) {
    messages.push({ level: 'warning', message: `支柱長 ${d.mastLength.toFixed(0)} mm が造形高さ ${d.printerBedZ.toFixed(0)} mmを超えている` })
  }
  if (d.footprintDiameter <= d.hubDiameter + d.footRadius * 2) {
    messages.push({ level: 'error', message: '設置径が小さすぎて3本足を生成できない' })
  }
  if (d.footprintDiameter < d.standHeight * 0.6) {
    messages.push({ level: 'warning', message: 'ケーブル荷重に対して設置径が小さい。転倒しやすさは実機で確認する' })
  }
  if (d.holderClearance <= 0) {
    messages.push({ level: 'error', message: 'ホルダークリアランスは正の値にする' })
  } else if (d.holderClearance < 0.25 || d.holderClearance > 0.8) {
    messages.push({ level: 'warning', message: 'ホルダークリアランスは通常0.25〜0.80 mm/片側で調整する' })
  }
  if (d.holderWall < 2.4) {
    messages.push({ level: 'error', message: 'ホルダー肉厚は2.4 mm以上にする' })
  }
  if (d.cableDiameter <= 0) {
    messages.push({ level: 'error', message: 'ケーブル径は正の値にする' })
  }
  const connectorBottomFromCenter = VIDEOMIC_ME_C.bodyDiameter / 2 + 3.4 + 3.6
  const cableBendSpace = d.holderOuterRadius + d.holderLift - connectorBottomFromCenter
  if (cableBendSpace < d.cableDiameter * 3) {
    messages.push({ level: 'warning', message: 'USB-C直下の曲げ逃げが小さい。ホルダー持ち上げを増やす' })
  }

  if (!messages.some((message) => message.level === 'error')) {
    const [baseX, baseY] = geometrySize(createMicrophoneBase(d))
    if (!findRotatedRectangleFit(baseX, baseY, d.printerBedX, d.printerBedY).fits) {
      messages.push({
        level: 'warning',
        message: `三脚ベースの造形面 ${baseX.toFixed(0)}×${baseY.toFixed(0)} mm は ${d.printerBedX.toFixed(0)}×${d.printerBedY.toFixed(0)} mm に回転配置しても収まらない`,
      })
    }
    const [holderX, holderY] = geometrySize(createMicrophoneHolder(d))
    if (!findRotatedRectangleFit(holderX, holderY, d.printerBedX, d.printerBedY).fits) {
      messages.push({ level: 'warning', message: 'マイクホルダーがプリントベッドに収まらない' })
    }
  }

  return messages
}
