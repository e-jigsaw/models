import { useRef, useState, type ChangeEvent } from 'react'
import { parseMicrophoneSettings, serializeMicrophoneSettings } from '../microphone/preset'
import type { MicrophoneStandParameters } from '../microphone/parameters'

export function MicrophoneSettingsPanel({
  parameters,
  onImport,
}: {
  parameters: MicrophoneStandParameters
  onImport: (parameters: MicrophoneStandParameters) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ level: 'success' | 'error'; message: string }>()

  const exportSettings = () => {
    const url = URL.createObjectURL(new Blob([serializeMicrophoneSettings(parameters)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'videomic-me-c-stand-settings.json'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
    setStatus({ level: 'success', message: '設定JSONを書き出した' })
  }

  const importSettings = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    try {
      onImport(parseMicrophoneSettings(await file.text()))
      setStatus({ level: 'success', message: `${file.name} を読み込んだ` })
    } catch (error) {
      setStatus({ level: 'error', message: error instanceof Error ? error.message : '設定を読み込めない' })
    }
  }

  return (
    <section className="settings-panel">
      <h2>設定ファイル</h2>
      <div className="settings-actions">
        <button type="button" onClick={exportSettings}>設定JSONを書き出す</button>
        <button type="button" onClick={() => fileInput.current?.click()}>設定JSONを読み込む</button>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          aria-label="VideoMic Me-C設定JSONファイル"
          onChange={importSettings}
        />
      </div>
      {status && <p className={`settings-status ${status.level}`}>{status.message}</p>}
      <p className="settings-note">支柱長・3点設置径・ホルダー・ケーブル設定を保存</p>
    </section>
  )
}
