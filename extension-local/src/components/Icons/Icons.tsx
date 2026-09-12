import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const RefreshIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
)

export const CameraIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)

/** Seven-hex flower used as the app mark. */
export const HexLogo = ({ size = 28 }: { size?: number }) => {
  const r = 9
  const h = (Math.sqrt(3) / 2) * r
  const hex = (cx: number, cy: number, fill: string) => {
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 90)
      return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`
    }).join(' ')
    return <polygon key={`${cx},${cy}`} points={points} fill={fill} />
  }
  const c = 24
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {hex(c, c - 2 * h, 'var(--tile-lumber)')}
      {hex(c + 1.5 * r, c - h, 'var(--tile-grain)')}
      {hex(c + 1.5 * r, c + h, 'var(--tile-brick)')}
      {hex(c, c + 2 * h, 'var(--tile-wool)')}
      {hex(c - 1.5 * r, c + h, 'var(--tile-stone)')}
      {hex(c - 1.5 * r, c - h, 'var(--tile-wool)')}
      {hex(c, c, 'var(--tile-desert)')}
    </svg>
  )
}
