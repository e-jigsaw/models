import { describe, expect, it } from 'vitest'
import { defaultParameters } from '../domain/parameters'
import { parseSettings, serializeSettings } from './preset'

describe('settings preset', () => {
  it('round-trips every stand parameter', () => {
    const parameters = { ...defaultParameters, angle: 27, frontBeamChamber: '3:1' }
    expect(parseSettings(serializeSettings(parameters))).toEqual(parameters)
  })

  it('rejects malformed JSON', () => {
    expect(() => parseSettings('{broken')).toThrow('JSONを解析できない')
  })

  it('rejects unsupported schema versions', () => {
    expect(() => parseSettings(JSON.stringify({ schemaVersion: 2, parameters: defaultParameters })))
      .toThrow('未対応のschemaVersion')
  })

  it('rejects missing or invalid parameter values', () => {
    const parameters = { ...defaultParameters } as Record<string, unknown>
    delete parameters.angle
    expect(() => parseSettings(JSON.stringify({ schemaVersion: 1, parameters })))
      .toThrow('angle は有限の数値')
  })
})
