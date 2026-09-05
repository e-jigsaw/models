import type { ClipParameters } from '../clip/parameters'
import { NumberControl } from './Controls'

type NumericKey = keyof ClipParameters

type ClipControlsProps = {
  parameters: ClipParameters
  onChange: (next: ClipParameters) => void
}

export function ClipControls({ parameters, onChange }: ClipControlsProps) {
  const setNumber = (name: NumericKey, value: number) => {
    if (Number.isFinite(value)) onChange({ ...parameters, [name]: value })
  }

  return (
    <div className="controls">
      <section>
        <h2>モニター保持部</h2>
        <NumberControl label="モニター下端厚" name="monitorThickness" value={parameters.monitorThickness} min={15} max={60} step={0.5} onChange={setNumber} />
        <NumberControl label="片側クリアランス" name="fitClearance" value={parameters.fitClearance} min={0} max={3} step={0.1} onChange={setNumber} />
        <NumberControl label="クリップ幅" name="clipWidth" value={parameters.clipWidth} min={20} max={100} onChange={setNumber} />
        <NumberControl label="クリップ高さ" name="clipHeight" value={parameters.clipHeight} min={12} max={60} onChange={setNumber} />
        <NumberControl label="壁厚（上端）" name="wallThickness" value={parameters.wallThickness} min={2} max={10} step={0.5} onChange={setNumber} />
        <NumberControl label="外側面角度" name="wallAngle" value={parameters.wallAngle} min={55} max={85} step={1} unit="°" onChange={setNumber} />
        <NumberControl label="クリップ間の盛り上げ" name="clipBridgeHeight" value={parameters.clipBridgeHeight} min={0} max={20} step={0.5} onChange={setNumber} />
      </section>

      <section>
        <h2>土台</h2>
        <NumberControl label="土台幅" name="baseWidth" value={parameters.baseWidth} min={40} max={180} onChange={setNumber} />
        <NumberControl label="土台奥行" name="baseDepth" value={parameters.baseDepth} min={60} max={240} onChange={setNumber} />
        <NumberControl label="土台厚" name="baseThickness" value={parameters.baseThickness} min={3} max={16} step={0.5} onChange={setNumber} />
        <NumberControl label="角丸半径" name="cornerRadius" value={parameters.cornerRadius} min={1} max={30} onChange={setNumber} />
        <NumberControl label="左右端からの位置" name="edgeInset" value={parameters.edgeInset} min={50} max={250} step={5} onChange={setNumber} />
      </section>

      <section>
        <h2>プリンタ</h2>
        <div className="control-pair">
          <NumberControl label="ベッド X" name="printerBedX" value={parameters.printerBedX} min={100} max={1000} onChange={setNumber} />
          <NumberControl label="ベッド Y" name="printerBedY" value={parameters.printerBedY} min={100} max={1000} onChange={setNumber} />
        </div>
      </section>
    </div>
  )
}
