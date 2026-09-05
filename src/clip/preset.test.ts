import { describe, expect, it } from 'vitest'
import { defaultClipParameters } from './parameters'
import { parseClipSettings, serializeClipSettings } from './preset'

describe('monitor clip settings preset', () => {
  it('round-trips every clip parameter', () => {
    const parameters = { ...defaultClipParameters, monitorThickness: 31.5, baseDepth: 150 }
    expect(parseClipSettings(serializeClipSettings(parameters))).toEqual(parameters)
  })

  it('rejects malformed JSON', () => {
    expect(() => parseClipSettings('{broken')).toThrow('JSONを解析できない')
  })

  it('rejects unsupported schema versions', () => {
    expect(() => parseClipSettings(JSON.stringify({ schemaVersion: 5, parameters: defaultClipParameters })))
      .toThrow('未対応のschemaVersion')
  })

  it('migrates schema version 1 settings with the default wall angle', () => {
    const {
      wallAngle: _wallAngle,
      clipBridgeHeight: _clipBridgeHeight,
      ...version1Parameters
    } = defaultClipParameters
    expect(parseClipSettings(JSON.stringify({ schemaVersion: 1, parameters: version1Parameters })))
      .toEqual(defaultClipParameters)
  })

  it('migrates schema version 2 settings without a bridge rise', () => {
    const { clipBridgeHeight: _clipBridgeHeight, ...version2Parameters } = defaultClipParameters
    expect(parseClipSettings(JSON.stringify({ schemaVersion: 2, parameters: version2Parameters })))
      .toEqual(defaultClipParameters)
  })

  it('migrates schema version 3 floor thickness to a bridge rise', () => {
    const { clipBridgeHeight: _clipBridgeHeight, ...parameters } = defaultClipParameters
    const version3Parameters = { ...parameters, baseThickness: 7, clipFloorThickness: 10 }
    expect(parseClipSettings(JSON.stringify({ schemaVersion: 3, parameters: version3Parameters })))
      .toEqual({ ...defaultClipParameters, clipBridgeHeight: 3 })
  })

  it('rejects missing parameter values', () => {
    const parameters = { ...defaultClipParameters } as Record<string, unknown>
    delete parameters.clipWidth
    expect(() => parseClipSettings(JSON.stringify({ schemaVersion: 4, parameters })))
      .toThrow('clipWidth は有限の数値')
  })

  it('rejects non-numeric parameter values', () => {
    const parameters = { ...defaultClipParameters, fitClearance: '1' }
    expect(() => parseClipSettings(JSON.stringify({ schemaVersion: 4, parameters })))
      .toThrow('fitClearance は有限の数値')
  })
})
