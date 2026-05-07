import { useState } from 'react'

interface Props {
  onSend: (text: string) => Promise<void>
  disabled: boolean
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    try {
      setSending(true)
      await onSend(trimmed)
      setText('')
    } catch {
      // message text preserved for retry
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="msg-input-form" onSubmit={handleSubmit}>
      <input
        className="msg-input"
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled || sending}
        autoFocus
      />
      <button className="msg-send-btn" type="submit" disabled={disabled || sending || !text.trim()}>
        Send
      </button>
    </form>
  )
}
