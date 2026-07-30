import { useMemo, useState } from 'react'
import { Controls } from './components/Controls'
import { Preview } from './components/Preview'
import { SettingsPanel } from './components/SettingsPanel'
import { deriveDimensions } from './domain/derive'
import { defaultParameters, type StandParameters } from './domain/parameters'
import { validateDimensions } from './domain/validate'
import { downloadAssembly3mf, downloadFrontBeam, downloadLeg, downloadRearBeam } from './export/download'
import { createAssembly } from './geometry/model'

export function App() {
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
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">PARAMETRIC INSTRUMENT STAND</p>
          <h1>Flex Stand</h1>
        </div>
        <p className="header-note">脚 × 2 · 梁 × 2</p>
      </header>

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
            <div className="validation-card">
              <h2>製造チェック</h2>
              {validation.length === 0 ? (
                <p className="valid">形状パラメータに問題なし</p>
              ) : (
                <ul>
                  {validation.map((item) => (
                    <li className={item.level} key={item.message}>{item.message}</li>
                  ))}
                </ul>
              )}
            </div>

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
    </main>
  )
}
