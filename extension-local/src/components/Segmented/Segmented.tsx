import './Segmented.css'

type Option<T extends string> = { value: T; label: string; title?: string }

type SegmentedProps<T extends string> = {
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  size?: 'md' | 'sm'
}

/** A compact radio group styled as a segmented control. */
export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
}: SegmentedProps<T>) => (
  <div className={`segmented segmented-${size}`} role="radiogroup" aria-label={ariaLabel}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        className={`segmented-option ${option.value === value ? 'is-active' : ''}`}
        title={option.title}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
)
