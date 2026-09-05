import { measurements } from '@jscad/modeling'
import { findRotatedRectangleFit } from '../domain/bedFit'
import type { ValidationMessage } from '../domain/validate'
import { clipWallBaseThickness, createMonitorClip } from './model'
import { clipOpening, type ClipParameters } from './parameters'

const { measureBoundingBox } = measurements

export function validateClip(parameters: ClipParameters): ValidationMessage[] {
  const messages: ValidationMessage[] = []
  const opening = clipOpening(parameters)

  if (parameters.monitorThickness <= 0 || parameters.fitClearance < 0) {
    messages.push({ level: 'error', message: 'モニター厚とクリアランスは正の値にする' })
  }
  if (parameters.fitClearance < 0.5 || parameters.fitClearance > 2) {
    messages.push({ level: 'warning', message: '片側クリアランスは0.5〜2.0 mmを目安にする' })
  }
  if (parameters.wallThickness < 3) {
    messages.push({ level: 'error', message: 'クリップ壁厚は3 mm以上にする' })
  }
  if (parameters.wallAngle < 55 || parameters.wallAngle > 85) {
    messages.push({ level: 'error', message: '外側面角度は55〜85°にする' })
  }
  if (parameters.clipBridgeHeight < 0) {
    messages.push({ level: 'error', message: 'クリップ間の盛り上げは0 mm以上にする' })
  }
  if (parameters.clipBridgeHeight >= parameters.clipHeight) {
    messages.push({ level: 'error', message: 'クリップ間の盛り上げはクリップ高さ未満にする' })
  }
  if (parameters.clipWidth > parameters.baseWidth) {
    messages.push({ level: 'error', message: 'クリップ幅は土台幅以下にする' })
  }
  if (parameters.baseDepth < opening + clipWallBaseThickness(parameters) * 2 + 20) {
    messages.push({ level: 'error', message: '土台奥行はクリップ外寸より20 mm以上大きくする' })
  }
  if (parameters.cornerRadius <= 0 || parameters.cornerRadius * 2 >= Math.min(parameters.baseDepth, parameters.baseWidth)) {
    messages.push({ level: 'error', message: '土台の角丸半径が外形寸法に収まっていない' })
  }
  if (parameters.baseThickness < 4) {
    messages.push({ level: 'warning', message: '土台厚は4 mm以上を推奨' })
  }

  if (!messages.some((message) => message.level === 'error')) {
    const [minimum, maximum] = measureBoundingBox(createMonitorClip(parameters))
    const sizeX = maximum[0] - minimum[0]
    const sizeY = maximum[1] - minimum[1]
    if (!findRotatedRectangleFit(sizeX, sizeY, parameters.printerBedX, parameters.printerBedY).fits) {
      messages.push({
        level: 'warning',
        message: `造形面 ${sizeX.toFixed(0)}×${sizeY.toFixed(0)} mm は ${parameters.printerBedX.toFixed(0)}×${parameters.printerBedY.toFixed(0)} mm に収まらない`,
      })
    }
  }

  return messages
}
