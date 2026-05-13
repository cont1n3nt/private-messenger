import { memo } from 'react'

const GradientOverlay = memo(function GradientOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: [
          'radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(2,6,9,0.5) 70%, rgba(2,6,9,0.85) 100%)',
          'radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.02) 0%, transparent 50%)',
          'radial-gradient(ellipse at 80% 20%, rgba(0,212,224,0.02) 0%, transparent 40%)',
        ].join(', '),
      }}
    />
  )
})

export default GradientOverlay
