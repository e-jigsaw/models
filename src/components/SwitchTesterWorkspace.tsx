import { useMemo, useState } from 'react'
import { createTesterAssembly, createTesterPrint, defaultTesterParameters, TESTER, validateTester, type TesterParameters } from '../switchTester/model'
import { downloadStl, downloadTester3mf } from '../export/download'
import { NumberControl } from './Controls'
import { Preview } from './Preview'

export function SwitchTesterWorkspace() {
  const [parameters, setParameters] = useState(defaultTesterParameters)
  const [print, setPrint] = useState(false)
  const errors = validateTester(parameters)
  const valid = errors.length === 0
  const parts = useMemo(() => valid ? createTesterAssembly(parameters, print) : [], [parameters, print, valid])
  const setNumber = (name: keyof TesterParameters, value: number) => {
    if (Number.isFinite(value)) setParameters({ ...parameters, [name]: value })
  }
  return <div className="workspace">
    <aside className="sidebar"><div className="controls"><section>
      <h2>3キー・スイッチテスター</h2>
      <NumberControl label="スイッチ穴幅" name="holeSize" value={parameters.holeSize} min={13.8} max={14.5} step={0.05} onChange={setNumber} />
      <NumberControl label="全高" name="height" value={parameters.height} min={10} max={20} step={0.5} onChange={setNumber} />
      <NumberControl label="側壁厚" name="wallThickness" value={parameters.wallThickness} min={1.5} max={3} step={0.1} onChange={setNumber} />
      <p>横一列・底なし・基板なし。穴幅は実物の嵌まり具合に合わせて調整。</p>
    </section></div></aside>
    <section className="stage">
      <div className="preview-card">
        <Preview parts={parts} framing="tester" />
        <div className="keycap-view-toggle"><button className={!print ? 'active' : ''} onClick={() => setPrint(false)}>使用時</button><button className={print ? 'active' : ''} onClick={() => setPrint(true)}>印刷向き</button></div>
        <div className="view-hint">{print ? '天板を下にして印刷' : 'スイッチ・キーキャップは表示対象外'}</div>
      </div>
      <div className="readout-grid">
        <div className="readout"><span>外形</span><strong>62 × 24 × {parameters.height}<small> mm</small></strong></div>
        <div className="readout"><span>キーピッチ</span><strong>{TESTER.pitch}<small> mm</small></strong></div>
        <div className="readout"><span>穴幅</span><strong>{parameters.holeSize.toFixed(2)}<small> mm</small></strong></div>
        <div className="readout"><span>天板厚</span><strong>{TESTER.plateThickness}<small> mm</small></strong></div>
      </div>
      <div className="bottom-row">
        <div className="validation-card"><h2>製造チェック</h2>{valid ? <p>形状パラメータに問題なし。実物のスイッチ嵌合は未確認。</p> : errors.map((e) => <p key={e.message}>{e.message}</p>)}</div>
        <div className="export-card"><h2>モデル出力</h2><div className="export-actions">
          <button disabled={!valid} onClick={() => downloadStl(createTesterPrint(parameters), 'three-key-switch-tester.stl')}>枠 STL</button>
          <button className="primary" disabled={!valid} onClick={() => downloadTester3mf(parameters)}>枠 3MF</button>
        </div><p>出力は天板を下にした印刷向き。底蓋・サポート材なし。</p></div>
      </div>
    </section>
  </div>
}
