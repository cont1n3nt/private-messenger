import { memo } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface FloatingOrbProps {
  color: string
  size: number
  x: string
  y: string
  duration: number
  delay?: number
}

const FloatingOrb = memo(function FloatingOrb({
  color,
  size,
  x,
  y,
  duration,
  delay = 0,
}: FloatingOrbProps) {
  const reduced = useReducedMotion()

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: 'blur(40px)',
        willChange: 'transform',
        transform: 'translateZ(0)',
        animation: reduced
          ? 'none'
          : `orb-float ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  )
})

export default FloatingOrb
