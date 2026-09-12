import { MODEL_SETS, type ModelSetId, isModelSetId } from '../../vision/modelSets'
import './ModelPicker.css'

type ModelPickerProps = {
  value: ModelSetId
  onChange: (value: ModelSetId) => void
  disabled: boolean
}

/** Lets the user pick which shipped model set reads the board, so sets can be compared on real games. */
export const ModelPicker = ({ value, onChange, disabled }: ModelPickerProps) => (
  <label className="model-picker" title={MODEL_SETS.find((set) => set.id === value)?.description}>
    <span className="model-picker-label">Model</span>
    <select
      className="model-picker-select"
      value={value}
      disabled={disabled}
      onChange={(event) => {
        if (isModelSetId(event.target.value)) onChange(event.target.value)
      }}
    >
      {MODEL_SETS.map((set) => (
        <option key={set.id} value={set.id}>
          {set.label}
        </option>
      ))}
    </select>
  </label>
)
