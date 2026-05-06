import type { DecryptedMessage } from '../store/ChatContext'

interface Props {
  msg: DecryptedMessage
  myUserId: number
  userMap: Map<number, string>
}

export default function MessageBubble({ msg, myUserId, userMap }: Props) {
  const isMine = msg.sender_id === myUserId
  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const senderName = userMap.get(msg.sender_id) ?? `User ${msg.sender_id}`

  return (
    <div className={`msg ${isMine ? 'msg-mine' : 'msg-other'}`}>
      <div className="msg-bubble">
        {!isMine && <div className="msg-sender">@{senderName}</div>}
        <div className="msg-text">{msg.text}</div>
        <div className="msg-time">{time}</div>
      </div>
    </div>
  )
}
