import type { CSSProperties } from 'react'
import type { BeamChamberProfile } from '../domain/derive'
import type { StandParameters } from '../domain/parameters'

type NumericKey = Exclude<keyof StandParameters, 'mode' | 'frontBeamChamber' | 'rearBeamChamber'>

type NumberControlProps<TName extends string> = {
  label: string
  name: TName
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (name: TName, value: number) => void
}

export function NumberControl<TName extends string>({ label, name, value, min, max, step = 1, unit = 'mm', onChange }: NumberControlProps<TName>) {
  const progress = ((value - min) / (max - min)) * 100

  return (
    <div className="number-control">
      <div className="control-heading">
        <label htmlFor={`${name}-number`}>{label}</label>
        <span className="control-input">
          <input
            aria-label={`${label} 数値`}
            id={`${name}-number`}
            type="number"
            name={name}
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
          id={`${name}-range`}
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

type ControlsProps = {
  parameters: StandParameters
  chambers: BeamChamberProfile[]
  availableBeamChambers: string[]
  frontBeamChamber: string
  rearBeamChamber: string
  onChange: (next: StandParameters) => void
}

export function Controls({
  parameters,
  chambers,
  availableBeamChambers,
  frontBeamChamber,
  rearBeamChamber,
  onChange,
}: ControlsProps) {
  const setNumber = (name: NumericKey, value: number) => {
    if (Number.isFinite(value)) onChange({ ...parameters, [name]: value })
  }

  return (
    <div className="controls">
      <section>
        <h2>形状</h2>
        <label className="control">
          <span>指定方法</span>
          <select
            value={parameters.mode}
            onChange={(event) => onChange({ ...parameters, mode: event.target.value as StandParameters['mode'] })}
          >
            <option value="slope">斜辺長 + 角度</option>
            <option value="footprint">設置奥行 + 角度</option>
          </select>
        </label>
        {parameters.mode === 'slope' ? (
          <NumberControl label="斜辺長" name="slopeLength" value={parameters.slopeLength} min={80} max={600} onChange={setNumber} />
        ) : (
          <NumberControl label="底面投影長" name="baseProjection" value={parameters.baseProjection} min={80} max={600} onChange={setNumber} />
        )}
        <NumberControl label="傾斜角" name="angle" value={parameters.angle} min={5} max={55} step={1} unit="°" onChange={setNumber} />
        <NumberControl label="スタンド幅" name="standWidth" value={parameters.standWidth} min={120} max={1000} onChange={setNumber} />
        <NumberControl label="フレーム幅" name="frameWidth" value={parameters.frameWidth} min={14} max={50} onChange={setNumber} />
        <NumberControl label="脚の厚さ" name="legThickness" value={parameters.legThickness} min={8} max={40} onChange={setNumber} />
        <NumberControl label="落下防止リップ" name="lipHeight" value={parameters.lipHeight} min={8} max={80} onChange={setNumber} />
      </section>

      <section>
        <h2>格子・梁・嵌合</h2>
        <NumberControl label="縦柱の最大間隔" name="ribMaxSpacing" value={parameters.ribMaxSpacing} min={25} max={100} step={5} onChange={setNumber} />
        <NumberControl label="横桟の最大間隔" name="gridMaxSpacing" value={parameters.gridMaxSpacing} min={20} max={80} step={5} onChange={setNumber} />
        <NumberControl label="格子材の幅" name="ribWidth" value={parameters.ribWidth} min={4} max={24} onChange={setNumber} />
        <label className="control">
          <span>前梁のチャンバー</span>
          <select
            aria-label="前梁のチャンバー"
            value={frontBeamChamber}
            onChange={(event) => onChange({ ...parameters, frontBeamChamber: event.target.value })}
          >
            {chambers.map((chamber) => (
              <option disabled={!availableBeamChambers.includes(chamber.id)} key={chamber.id} value={chamber.id}>
                {chamber.label}{availableBeamChambers.includes(chamber.id) ? '' : '（寸法不足）'}
              </option>
            ))}
          </select>
        </label>
        <label className="control">
          <span>後梁のチャンバー</span>
          <select
            aria-label="後梁のチャンバー"
            value={rearBeamChamber}
            onChange={(event) => onChange({ ...parameters, rearBeamChamber: event.target.value })}
          >
            {chambers.map((chamber) => (
              <option disabled={!availableBeamChambers.includes(chamber.id)} key={chamber.id} value={chamber.id}>
                {chamber.label}{availableBeamChambers.includes(chamber.id) ? '' : '（寸法不足）'}
              </option>
            ))}
          </select>
        </label>
        <NumberControl label="片側クリアランス" name="fitClearance" value={parameters.fitClearance} min={0.1} max={0.8} step={0.05} onChange={setNumber} />
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
