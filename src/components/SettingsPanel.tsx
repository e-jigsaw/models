import { useRef, useState, type ChangeEvent } from 'react'

type SettingsPanelProps<TParameters> = {
  parameters: TParameters
  filename: string
  note: string
  serialize: (parameters: TParameters) => string
  parse: (json: string) => TParameters
  onImport: (parameters: TParameters) => void
}

export function SettingsPanel<TParameters>({
  parameters,
  filename,
  note,
  serialize,
  parse,
  onImport,
}: SettingsPanelProps<TParameters>) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ level: 'success' | 'error'; message: string }>()

  const exportSettings = () => {
    const url = URL.createObjectURL(new Blob([serialize(parameters)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
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
    if (file.size > 1_000_000) {
      setStatus({ level: 'error', message: '設定ファイルは1MB以下にする' })
      return
    }
    try {
      const next = parse(await file.text())
      onImport(next)
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
          aria-label="設定JSONファイル"
          onChange={importSettings}
        />
      </div>
      {status && <p className={`settings-status ${status.level}`}>{status.message}</p>}
      <p className="settings-note">{note}</p>
    </section>
  )
}
