import { cherryRowProfiles, type KeycapParameters } from '../keycap/parameters'
import { NumberControl } from './Controls'

type NumericKey = Exclude<keyof KeycapParameters, 'row' | 'stemShape'>

export function KeycapControls({ parameters, onChange }: { parameters: KeycapParameters; onChange: (next: KeycapParameters) => void }) {
  const setNumber = (name: NumericKey, value: number) => {
    if (Number.isFinite(value)) onChange({ ...parameters, [name]: value })
  }

  return (
    <div className="controls">
      <section>
        <h2>Cherry profile</h2>
        <label className="control">
          <span>Row</span>
          <select value={parameters.row} onChange={(event) => onChange({ ...parameters, row: Number(event.target.value) as KeycapParameters['row'] })}>
            {([1, 2, 3, 4] as const).map((row) => <option key={row} value={row}>{cherryRowProfiles[row].label}</option>)}
          </select>
        </label>
        <NumberControl label="側壁厚" name="wallThickness" value={parameters.wallThickness} min={0.8} max={2} step={0.05} onChange={setNumber} />
        <NumberControl label="天面厚" name="topThickness" value={parameters.topThickness} min={1.2} max={2.5} step={0.05} onChange={setNumber} />
      </section>
      <section>
        <h2>MX stem</h2>
        <label className="control">
          <span>ステム形状</span>
          <select value={parameters.stemShape} onChange={(event) => onChange({ ...parameters, stemShape: event.target.value as KeycapParameters['stemShape'] })}>
            <option value="box">角形（角丸）</option>
            <option value="round">丸形</option>
          </select>
        </label>
        <NumberControl label={parameters.stemShape === 'box' ? 'ステム外幅' : 'ステム外径'} name="stemOuterDiameter" value={parameters.stemOuterDiameter} min={5} max={7} step={0.01} onChange={setNumber} />
        <NumberControl label="嵌合補正" name="stemFitClearance" value={parameters.stemFitClearance} min={0} max={0.5} step={0.01} onChange={setNumber} />
        <NumberControl label="差し込み深さ" name="stemDepth" value={parameters.stemDepth} min={3.2} max={4.5} step={0.05} onChange={setNumber} />
      </section>
      <section>
        <h2>Multicolor</h2>
        <NumberControl label="インレイ深さ" name="inlayDepth" value={parameters.inlayDepth} min={0.4} max={1.2} step={0.05} onChange={setNumber} />
      </section>
    </div>
  )
}
