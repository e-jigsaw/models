import { describe, expect, it } from 'vitest'
import { defaultMicrophoneStandParameters } from './parameters'
import { parseMicrophoneSettings, serializeMicrophoneSettings } from './preset'

describe('VideoMic Me-C settings', () => {
  it('round-trips every parameter', () => {
    expect(parseMicrophoneSettings(serializeMicrophoneSettings(defaultMicrophoneStandParameters)))
      .toEqual(defaultMicrophoneStandParameters)
  })

  it('rejects non-finite or wrong-product data', () => {
    const parsed = JSON.parse(serializeMicrophoneSettings(defaultMicrophoneStandParameters))
    parsed.parameters.mastLength = '325'
    expect(() => parseMicrophoneSettings(JSON.stringify(parsed))).toThrow('mastLength')
    parsed.parameters.mastLength = 325
    parsed.product = 'other'
    expect(() => parseMicrophoneSettings(JSON.stringify(parsed))).toThrow('VideoMic Me-C')
  })
})
