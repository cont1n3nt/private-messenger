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
              x: [0, 22, -16, 12, -8, 0],
              y: [0, -18, 14, -12, 6, 0],
              scale: [1, 1.08, 0.95, 1.04, 0.98, 1],
            }
      }
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
})

export default FloatingOrb
