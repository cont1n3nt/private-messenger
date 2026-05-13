import { memo } from 'react'
import { motion } from 'framer-motion'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import LoginField from './LoginField'
import KeyImportSection from './KeyImportSection'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface LoginCardProps {
  username: string
  onUsernameChange: (value: string) => void
  keyJson: string
  onKeyJsonChange: (value: string) => void
  error: string
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onResetKeys: () => void
}

const LoginCard = memo(function LoginCard({
  username,
  onUsernameChange,
  keyJson,
  onKeyJsonChange,
  error,
  loading,
  onSubmit,
  onResetKeys,
}: LoginCardProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className="w-full max-w-[360px] px-4"
      initial={!reduced ? { opacity: 0, y: 14 } : undefined}
      animate={!reduced ? { opacity: 1, y: 0 } : undefined}
      transition={!reduced ? { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } : undefined}
    >
      <GlassPanel variant="strong" className="p-6">
        <div className="mb-0.5">
          <h1 className="text-[22px] font-semibold leading-[28px] text-text-primary">
            Private Messenger
          </h1>
        </div>
        <p className="text-[13px] leading-[18px] text-text-muted mb-5">
          E2E encrypted group chat
        </p>

        <form onSubmit={onSubmit}>
          <LoginField
            id="login-username"
            label="Username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="e.g. kosmo"
            required
            autoFocus
          />

          <KeyImportSection value={keyJson} onChange={onKeyJsonChange} />

          {error && (
            <div className="mt-3 text-[12px] text-danger leading-relaxed">
              {error}
            </div>
          )}

          <NeonButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || !username.trim()}
            className="w-full mt-5"
          >
            {loading ? 'Logging in...' : 'Login'}
          </NeonButton>

          <NeonButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetKeys}
            disabled={!username.trim()}
            className="w-full mt-2"
          >
            Reset stored keys
          </NeonButton>
        </form>
      </GlassPanel>
    </motion.div>
  )
})

export default LoginCard
