import { memo } from 'react'
import NoiseTexture from './NoiseTexture'
import FloatingOrb from './FloatingOrb'

interface WallpaperLayerProps {
  seed?: number
  density?: number
  showOrbs?: boolean
}

const WallpaperLayer = memo(function WallpaperLayer({
  showOrbs = false,
}: WallpaperLayerProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#17212b' }} />
      {showOrbs && (
        <>
          <FloatingOrb color="rgba(106,178,245,0.15)" size={280} x="10%" y="20%" duration={16} delay={0} />
          <FloatingOrb color="rgba(139,92,246,0.12)" size={320} x="75%" y="60%" duration={20} delay={-3} />
          <FloatingOrb color="rgba(0,212,224,0.10)" size={240} x="50%" y="80%" duration={18} delay={-6} />
        </>
      )}
      <NoiseTexture />
    </div>
  )
})

export default WallpaperLayer
