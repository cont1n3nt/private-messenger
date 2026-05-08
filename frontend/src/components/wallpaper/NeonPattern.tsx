import { memo, useMemo } from 'react'
import { icons } from './icons'
import { neonStrokeColors } from '../../theme/colors'

function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface IconInstance {
  id: string
  symbolId: string
  x: number
  y: number
  rotation: number
  scale: number
  opacity: number
  color: string
}

interface NeonPatternProps {
  seed?: number
  density?: number
  colors?: readonly string[]
  baseOpacity?: number
}

function generateInstances(
  seed: number,
  density: number,
  colors: readonly string[],
  baseOpacity: number,
): IconInstance[] {
  const rng = mulberry32(seed)
  const instances: IconInstance[] = []
  const minDist = 20

  for (let i = 0; i < density; i++) {
    const iconIdx = Math.floor(rng() * icons.length)
    const icon = icons[iconIdx]
    const x = rng() * 100
    const y = rng() * 100

    let tooClose = false
    for (const existing of instances) {
      const dx = existing.x - x
      const dy = existing.y - y
      if (Math.sqrt(dx * dx + dy * dy) < minDist) {
        tooClose = true
        break
      }
    }
    if (tooClose) continue

    instances.push({
      id: `${icon.id}-${i}`,
      symbolId: icon.id,
      x,
      y,
      rotation: (rng() - 0.5) * 50,
      scale: 0.6 + rng() * 0.5,
      opacity: baseOpacity * (0.5 + rng() * 0.5),
      color: colors[Math.floor(rng() * colors.length)],
    })
  }

  return instances
}

const NeonPattern = memo(function NeonPattern({
  seed = 42,
  density = 40,
  colors = neonStrokeColors,
  baseOpacity = 0.12,
}: NeonPatternProps) {
  const instances = useMemo(
    () => generateInstances(seed, density, colors, baseOpacity),
    [seed, density, colors, baseOpacity],
  )

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
          <feComponentTransfer in="blur2" result="dimGlow">
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="dimGlow" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {icons.map((icon) => (
          <symbol
            key={icon.id}
            id={icon.id}
            viewBox={icon.viewBox}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {icon.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </symbol>
        ))}
      </defs>

      {instances.map((inst) => (
        <g
          key={inst.id}
          transform={`translate(${inst.x}%, ${inst.y}%) rotate(${inst.rotation}) scale(${inst.scale})`}
          opacity={inst.opacity}
          filter="url(#neon-glow)"
          style={{ transformBox: 'fill-box' }}
        >
          <use
            href={`#${inst.symbolId}`}
            width="24"
            height="24"
            x="-12"
            y="-12"
            stroke={inst.color}
            strokeWidth="1"
            fill="none"
          />
        </g>
      ))}
    </svg>
  )
})

export default NeonPattern
