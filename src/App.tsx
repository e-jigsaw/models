import { useMemo, useState } from 'react'
import { Controls } from './components/Controls'
import { MicrophoneControls } from './components/MicrophoneControls'
import { MicrophoneSettingsPanel } from './components/MicrophoneSettingsPanel'
import { Preview } from './components/Preview'
import { SettingsPanel } from './components/SettingsPanel'
import { deriveDimensions } from './domain/derive'
import { defaultParameters, type StandParameters } from './domain/parameters'
import { validateDimensions } from './domain/validate'
import {
  downloadAssembly3mf,
  downloadFrontBeam,
  downloadLeg,
  downloadMicrophoneAssembly3mf,
  downloadMicrophoneBase,
  downloadMicrophoneHolder,
  downloadMicrophoneMast,
  downloadRearBeam,
} from './export/download'
import { createAssembly } from './geometry/model'
import { deriveMicrophoneStand } from './microphone/derive'
import { createMicrophoneAssembly } from './microphone/model'
import {
  defaultMicrophoneStandParameters,
  type MicrophoneStandParameters,
} from './microphone/parameters'
import { validateMicrophoneStand } from './microphone/validate'

type ProductMode = 'instrument' | 'videomic-me-c'

function InstrumentStandWorkspace() {
  const [parameters, setParameters] = useState<StandParameters>(defaultParameters)
  const dimensions = useMemo(() => deriveDimensions(parameters), [parameters])
  const validation = useMemo(() => validateDimensions(dimensions), [dimensions])
  const hasErrors = validation.some((item) => item.level === 'error')
  const parts = useMemo(() => hasErrors ? [] : createAssembly(dimensions), [dimensions, hasErrors])
  const settingsParameters = useMemo(() => ({
    ...parameters,
    frontBeamChamber: dimensions.frontBeamChamber,
    rearBeamChamber: dimensions.rearBeamChamber,
  }), [parameters, dimensions.frontBeamChamber, dimensions.rearBeamChamber])

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Controls
          parameters={parameters}
          chambers={dimensions.beamChamberProfiles}
          availableBeamChambers={dimensions.availableBeamChambers}
          frontBeamChamber={dimensions.frontBeamChamber}
          rearBeamChamber={dimensions.rearBeamChamber}
          onChange={setParameters}
        />
        <SettingsPanel parameters={settingsParameters} onImport={setParameters} />
      </aside>

      <section className="stage">
        <div className="preview-card">
          <Preview parts={parts} />
          <div className="view-hint">ドラッグで回転 · スクロールで拡大</div>
        </div>

        <div className="readout-grid">
          <div className="readout"><span>設置奥行</span><strong>{dimensions.floorLength.toFixed(1)}<small> mm</small></strong></div>
          <div className="readout"><span>高さ</span><strong>{dimensions.height.toFixed(1)}<small> mm</small></strong></div>
          <div className="readout"><span>斜辺長</span><strong>{dimensions.slopeLength.toFixed(1)}<small> mm</small></strong></div>
          <div className="readout"><span>梁長</span><strong>{dimensions.beamLength.toFixed(1)}<small> mm</small></strong></div>
        </div>

        <div className="bottom-row">
          <ValidationCard validation={validation} />
          <div className="export-card">
            <h2>モデル出力</h2>
            <div className="export-actions">
              <button disabled={hasErrors} onClick={() => downloadLeg(dimensions)}>脚 STL</button>
              <button disabled={hasErrors} onClick={() => downloadFrontBeam(dimensions)}>前梁 STL</button>
              <button disabled={hasErrors} onClick={() => downloadRearBeam(dimensions)}>後梁 STL</button>
              <button className="primary" disabled={hasErrors} onClick={() => downloadAssembly3mf(dimensions)}>一式 3MF</button>
            </div>
            <p>脚は同じSTLを2個、前梁・後梁は各1個を印刷</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function MicrophoneStandWorkspace() {
  const [parameters, setParameters] = useState<MicrophoneStandParameters>(defaultMicrophoneStandParameters)
  const dimensions = useMemo(() => deriveMicrophoneStand(parameters), [parameters])
  const validation = useMemo(() => validateMicrophoneStand(dimensions), [dimensions])
  const hasErrors = validation.some((item) => item.level === 'error')
  const parts = useMemo(() => hasErrors ? [] : createMicrophoneAssembly(dimensions), [dimensions, hasErrors])

  return (
    <div className="workspace">
      <aside className="sidebar">
        <MicrophoneControls parameters={parameters} onChange={setParameters} />
        <MicrophoneSettingsPanel parameters={parameters} onImport={setParameters} />
      </aside>

      <section className="stage">
        <div className="preview-card">
          <Preview parts={parts} framing="microphone" />
          <div className="view-hint">黒・銀は参照形状 · 出力対象外</div>
        </div>

        <div className="readout-grid">
          <div className="readout"><span>3点の設置径</span><strong>{dimensions.footprintDiameter.toFixed(0)}<small> mm</small></strong></div>
          <div className="readout"><span>マイク中心高</span><strong>{dimensions.standHeight.toFixed(0)}<small> mm</small></strong></div>
          <div className="readout"><span>一体支柱長</span><strong>{dimensions.mastLength.toFixed(1)}<small> mm</small></strong></div>
          <div className="readout"><span>ホルダー内径</span><strong>{(dimensions.holderInnerRadius * 2).toFixed(1)}<small> mm</small></strong></div>
        </div>

        <div className="bottom-row">
          <ValidationCard validation={validation} />
          <div className="export-card">
            <h2>モデル出力</h2>
            <div className="export-actions wrap">
              <button disabled={hasErrors} onClick={() => downloadMicrophoneBase(dimensions)}>三脚ベース STL</button>
              <button disabled={hasErrors} onClick={() => downloadMicrophoneMast(dimensions)}>支柱 STL</button>
              <button disabled={hasErrors} onClick={() => downloadMicrophoneHolder(dimensions)}>ホルダー STL</button>
              <button className="primary" disabled={hasErrors} onClick={() => downloadMicrophoneAssembly3mf(dimensions)}>一式 3MF</button>
            </div>
            <p>三脚ベース・325mm支柱・ホルダーを各1個印刷</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function ValidationCard({ validation }: { validation: Array<{ level: 'error' | 'warning'; message: string }> }) {
  return (
    <div className="validation-card">
      <h2>製造チェック</h2>
      {validation.length === 0 ? (
        <p className="valid">形状パラメータに問題なし</p>
      ) : (
        <ul>
          {validation.map((item) => <li className={item.level} key={item.message}>{item.message}</li>)}
        </ul>
      )}
    </div>
  )
}

export function App() {
  const [product, setProduct] = useState<ProductMode>('videomic-me-c')
  const microphone = product === 'videomic-me-c'

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">PARAMETRIC DESK HARDWARE</p>
          <h1>Flex Stand</h1>
        </div>
        <p className="header-note">{microphone ? '三脚ベース · 325mm一体支柱 · Me-Cホルダー' : '脚 × 2 · 梁 × 2'}</p>
      </header>

      <nav className="product-tabs" aria-label="製品モード">
        <button className={microphone ? 'active' : ''} onClick={() => setProduct('videomic-me-c')}>VideoMic Me-C</button>
        <button className={!microphone ? 'active' : ''} onClick={() => setProduct('instrument')}>楽器スタンド</button>
      </nav>

      {microphone ? <MicrophoneStandWorkspace /> : <InstrumentStandWorkspace />}
    </main>
  )
}
