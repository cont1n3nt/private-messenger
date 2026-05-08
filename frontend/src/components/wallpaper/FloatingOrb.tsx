import { memo } from 'react'
import { motion } from 'framer-motion'
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
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: 'blur(60px)',
      }}
      animate={
        reduced
          ? {}
          : {
              x: [0, 18, -12, 8, 0],
              y: [0, -14, 10, -8, 0],
            }
      }
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay,
      }}
    />
  )
})

export default FloatingOrb
