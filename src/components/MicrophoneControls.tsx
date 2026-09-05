import type { CSSProperties } from 'react'
import type { MicrophoneStandParameters } from '../microphone/parameters'

type NumericKey = keyof MicrophoneStandParameters

type NumberControlProps = {
  label: string
  name: NumericKey
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (name: NumericKey, value: number) => void
}

function NumberControl({ label, name, value, min, max, step = 1, unit = 'mm', onChange }: NumberControlProps) {
  const progress = ((value - min) / (max - min)) * 100
  return (
    <div className="number-control">
      <div className="control-heading">
        <label htmlFor={`microphone-${name}-number`}>{label}</label>
        <span className="control-input">
          <input
            aria-label={`${label} 数値`}
            id={`microphone-${name}-number`}
            type="number"
            value={Number(value.toFixed(2))}
            min={min}
            max={max}
            step={step}
            onChange={(event) => onChange(name, event.currentTarget.valueAsNumber)}
          />
          <small>{unit}</small>
        </span>
      </div>
      <div className="range-row">
        <input
          aria-label={`${label} スライダー`}
          className="range-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{ '--range-progress': `${Math.min(100, Math.max(0, progress))}%` } as CSSProperties}
          onChange={(event) => onChange(name, event.currentTarget.valueAsNumber)}
        />
        <span className="range-bound">{min}</span>
        <span className="range-bound range-bound-max">{max}</span>
      </div>
    </div>
  )
}

export function MicrophoneControls({
  parameters,
  onChange,
}: {
  parameters: MicrophoneStandParameters
  onChange: (next: MicrophoneStandParameters) => void
}) {
  const setNumber = (name: NumericKey, value: number) => {
    if (Number.isFinite(value)) onChange({ ...parameters, [name]: value })
  }

  return (
    <div className="controls">
      <section>
        <h2>スタンド</h2>
        <NumberControl label="一体支柱長" name="mastLength" value={parameters.mastLength} min={250} max={325} step={5} onChange={setNumber} />
        <NumberControl label="3点の設置径" name="footprintDiameter" value={parameters.footprintDiameter} min={200} max={300} step={5} onChange={setNumber} />
        <NumberControl label="支柱径" name="mastDiameter" value={parameters.mastDiameter} min={14} max={28} onChange={setNumber} />
        <NumberControl label="マイク前出し" name="holderForwardOffset" value={parameters.holderForwardOffset} min={0} max={70} onChange={setNumber} />
        <NumberControl label="ホルダー持ち上げ" name="holderLift" value={parameters.holderLift} min={18} max={50} onChange={setNumber} />
        <NumberControl label="仰角" name="tiltAngle" value={parameters.tiltAngle} min={-20} max={35} unit="°" onChange={setNumber} />
      </section>

      <section>
        <h2>ホルダー・ケーブル</h2>
        <NumberControl label="ホルダー片側隙間" name="holderClearance" value={parameters.holderClearance} min={0.15} max={1.2} step={0.05} onChange={setNumber} />
        <NumberControl label="ホルダー肉厚" name="holderWall" value={parameters.holderWall} min={2.4} max={6} step={0.2} onChange={setNumber} />
        <NumberControl label="ホルダー幅" name="holderLength" value={parameters.holderLength} min={12} max={28} onChange={setNumber} />
        <NumberControl label="ケーブル径" name="cableDiameter" value={parameters.cableDiameter} min={3} max={8} step={0.2} onChange={setNumber} />
      </section>

      <section>
        <h2>嵌合・プリンタ</h2>
        <NumberControl label="嵌合片側隙間" name="fitClearance" value={parameters.fitClearance} min={0.1} max={0.8} step={0.05} onChange={setNumber} />
        <div className="control-pair">
          <NumberControl label="ベッド X" name="printerBedX" value={parameters.printerBedX} min={100} max={500} onChange={setNumber} />
          <NumberControl label="ベッド Y" name="printerBedY" value={parameters.printerBedY} min={100} max={500} onChange={setNumber} />
        </div>
        <NumberControl label="造形高さ Z" name="printerBedZ" value={parameters.printerBedZ} min={150} max={500} step={5} onChange={setNumber} />
      </section>
    </div>
  )
}
