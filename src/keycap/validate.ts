import { measurements } from '@jscad/modeling'
import { createKeycapAssembly, mxStemMinimumWall } from './model'
import { cherryRowProfiles, type KeycapParameters } from './parameters'

const { measureVolume } = measurements

export type KeycapValidation = { level: 'error' | 'warning'; message: string }

export function validateKeycap(parameters: KeycapParameters): KeycapValidation[] {
  const result: KeycapValidation[] = []
  if (parameters.wallThickness < 0.8) result.push({ level: 'error', message: '壁厚は0.8mm以上にする' })
  if (parameters.topThickness < parameters.inlayDepth + 0.5) result.push({ level: 'error', message: '天面厚はインレイ深さより0.5mm以上厚くする' })
  if (parameters.stemDepth < 3.2 || parameters.stemDepth > 4.5) result.push({ level: 'error', message: 'ステム深さは3.2〜4.5mmにする' })
  if (parameters.stemFitClearance < 0 || parameters.stemFitClearance > 0.5) result.push({ level: 'error', message: 'MX嵌合補正は0〜0.5mmにする' })
  if (parameters.stemOuterDiameter < 5 || parameters.stemOuterDiameter > 7) result.push({ level: 'error', message: 'ステム外寸は5〜7mmにする' })
  if (mxStemMinimumWall(parameters) < 0.4) result.push({ level: 'error', message: '0.2mmノズル向けにステム先端の肉厚を0.4mm以上にする' })
  if (parameters.stemDepth > cherryRowProfiles[parameters.row].height - parameters.topThickness - 0.2) result.push({ level: 'error', message: '差し込み深さを浅くして軸の根元に0.5mm以上残す' })
  if (result.some((item) => item.level === 'error')) return result

  const parts = createKeycapAssembly(parameters)
  if (parts.some((part) => measureVolume(part.geometry) <= 0.01)) {
    result.push({ level: 'error', message: '色別パーツの生成に失敗した' })
  }
  result.push({ level: 'warning', message: 'MX嵌合補正はプリンタごとにテストピースで調整する' })
  return result
}
