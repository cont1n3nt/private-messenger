import { memo } from 'react'
import NeonPattern from './NeonPattern'
import GradientOverlay from './GradientOverlay'
import NoiseTexture from './NoiseTexture'
import FloatingOrb from './FloatingOrb'

interface WallpaperLayerProps {
  seed?: number
  density?: number
  showOrbs?: boolean
}

const WallpaperLayer = memo(function WallpaperLayer({
  seed = 42,
  density = 40,
  showOrbs = true,
}: WallpaperLayerProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, #0a1628 0%, #060d18 50%, #020609 100%)',
        }}
      />

      <NeonPattern seed={seed} density={density} />

      <GradientOverlay />

      <NoiseTexture />

      {showOrbs && (
        <>
          <FloatingOrb
            color="rgba(0, 212, 224, 0.05)"
            size={350}
            x="70%"
            y="15%"
            duration={40}
            delay={0}
          />
          <FloatingOrb
            color="rgba(139, 92, 246, 0.04)"
            size={280}
            x="20%"
            y="55%"
            duration={50}
            delay={8}
          />
          <FloatingOrb
            color="rgba(0, 212, 224, 0.03)"
            size={220}
            x="55%"
            y="78%"
            duration={35}
            delay={14}
          />
        </>
      )}
    </div>
  )
})

export default WallpaperLayer
