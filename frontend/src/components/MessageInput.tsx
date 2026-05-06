import { useState } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  return (
    <form className="msg-input-form" onSubmit={handleSubmit}>
      <input
        className="msg-input"
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        autoFocus
      />
      <button className="msg-send-btn" type="submit" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  )
}
