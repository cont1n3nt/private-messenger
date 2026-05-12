import { memo, useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DecryptedMessage } from '../../store/ChatContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { detectLanguage } from '../../utils/languageDetector'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
}

function CodeBlock({ children, className }: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const [detectedLang, setDetectedLang] = useState<string>('')

  useEffect(() => {
    if (codeRef.current) {
      const codeElement = codeRef.current.querySelector('code')
      const text = codeElement?.textContent ?? codeRef.current.textContent ?? ''
      setDetectedLang(detectLanguage(text))
    }
  }, [])

  const explicitLang = className?.replace(/language-/, '')
  const language = explicitLang || detectedLang || 'Text'

  const handleCopy = async () => {
    if (!codeRef.current) return
    const codeElement = codeRef.current.querySelector('code')
    const text = codeElement?.textContent ?? ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-1 rounded-lg overflow-hidden">
      <pre ref={codeRef} className="overflow-x-auto p-3 bg-black/30 rounded-lg scrollbar-code">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/[0.08] select-none">
          <span className="text-[11px] font-medium text-white/70 uppercase tracking-wide">
            {language}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded-md transition-all duration-200 text-white/40 hover:text-white/80 hover:bg-white/[0.1]"
            title={copied ? 'Скопировано' : 'Копировать код'}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </button>
        </div>
        {children}
      </pre>
    </div>
  )
}

export interface ContextMenuEvent {
  x: number
  y: number
  message: DecryptedMessage
  senderName: string
}

interface MessageBubbleProps {
  msg: DecryptedMessage
  myUserId: number
  userMap: Map<number, string>
  userColors: Record<number, string>
  isConsecutive: boolean
  isLastInGroup: boolean
  onContextMenu: (event: ContextMenuEvent) => void
  allMessages?: DecryptedMessage[]
}

function getBubbleRadius(isMine: boolean, isLastInGroup: boolean): string {
  if (!isLastInGroup) return '18px'
  if (isMine) return '18px 18px 6px 18px'
  return '6px 18px 18px 18px'
}

const MessageBubble = memo(function MessageBubble({
  msg,
  myUserId,
  userMap,
  userColors,
  isConsecutive,
  isLastInGroup,
  onContextMenu,
  allMessages,
}: MessageBubbleProps) {
  const isMine = msg.sender_id === myUserId
  const reduced = useReducedMotion()
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const senderName = userMap.get(msg.sender_id) ?? `User ${msg.sender_id}`
  const showSender = !isMine && !isConsecutive
  const nickColor = userColors[msg.sender_id]

  const time = (() => {
    const isoString = msg.created_at.endsWith('Z') ? msg.created_at : msg.created_at + 'Z'
    const localDate = new Date(isoString)
    return localDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })
  })()

  const radius = getBubbleRadius(isMine, isLastInGroup)

  const repliedMsg = msg.reply_to_message >= 0 && allMessages
    ? allMessages.find((m) => m.id === msg.reply_to_message)
    : null

  const replyNickColor = repliedMsg
    ? (userColors[repliedMsg.sender_id] ?? '#6ab2f5')
    : undefined

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: msg,
      senderName,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchTimer.current = setTimeout(() => {
      onContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        message: msg,
        senderName,
      })
    }, 500)
  }

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
      touchTimer.current = undefined
    }
  }

  const handleTouchMove = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
      touchTimer.current = undefined
    }
  }

  return (
    <motion.div
      id={`msg-${msg.id}`}
      className={clsx(
        'flex',
        isMine ? 'justify-end' : 'justify-start',
        !isConsecutive ? 'mt-3' : 'mt-[2px]',
      )}
      layout={!reduced}
      initial={!reduced ? { opacity: 0, y: 12 } : undefined}
      animate={!reduced ? { opacity: 1, y: 0 } : undefined}
      exit={!reduced ? { opacity: 0, y: -8 } : undefined}
      transition={!reduced ? { duration: 0.2, ease: [0.16, 1, 0.3, 1], layout: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : undefined}
    >
      <div
        className={clsx(
          'bubble-hover',
          isMine
            ? isConsecutive ? 'bubble-mine-consecutive' : 'bubble-mine'
            : isConsecutive ? 'bubble-other-consecutive' : 'bubble-other',
          'relative max-w-[78%] sm:max-w-[68%] min-w-[80px] px-3.5 pt-2.5 pb-2',
        )}
        style={{ borderRadius: radius }}
        tabIndex={0}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
            const selection = window.getSelection()
            if (selection && selection.toString().trim()) {
              navigator.clipboard.writeText(selection.toString())
            }
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {showSender && (
          <div
            className="text-[13px] font-semibold mb-[1px] leading-[16px]"
            style={{ color: nickColor }}
          >
            @{senderName}
          </div>
        )}

        {repliedMsg && (
          <div
            className={clsx(
              'flex items-start gap-1.5 mb-1 px-2 py-1 rounded-lg text-[12px] leading-[15px]',
              'border-l-[3px]',
              isMine ? 'bg-white/[0.06]' : 'bg-white/[0.04]',
            )}
            style={{ borderLeftColor: replyNickColor }}
          >
            <div className="min-w-0 flex-1">
              <div
                className="font-medium text-[12px]"
                style={{ color: replyNickColor }}
              >
                @{userMap.get(repliedMsg.sender_id) ?? `User ${repliedMsg.sender_id}`}
              </div>
              <div className="text-text-muted truncate">
                {repliedMsg.text}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-1">
          <div className="markdown-content text-[15px] leading-[21px] text-text-primary break-words min-w-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                img: ({ alt, src }) => (
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    {alt || src}
                  </a>
                ),
                pre: ({ children }) => {
                  const codeChild = children as React.ReactElement<{ className?: string }> | null
                  const className = codeChild?.props?.className
                  return <CodeBlock className={className}>{children}</CodeBlock>
                },
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-white/10 text-[13px]" {...props}>
                        {children}
                      </code>
                    )
                  }
                  return <code className={className} {...props}>{children}</code>
                },
              }}
            >
              {msg.text.replace(/\n/g, '  \n')}
            </ReactMarkdown>
          </div>
          <div className="shrink-0 flex items-center gap-[3px] text-[10px] text-white/35 tabular-nums leading-none whitespace-nowrap msg-time">
            {msg.edited && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted/40 shrink-0">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            )}
            {time}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default MessageBubble