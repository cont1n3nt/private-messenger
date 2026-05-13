import { memo, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { detectLanguage } from '../../utils/languageDetector'
import { getSafeExternalUrl } from '../../utils/url'

interface MarkdownMessageProps {
  text: string
}

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
}

function CodeBlock({ children, className }: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const [detectedLang, setDetectedLang] = useState<string>('')

  useEffect(() => {
    if (!codeRef.current) return

    const codeElement = codeRef.current.querySelector('code')
    const text = codeElement?.textContent ?? codeRef.current.textContent ?? ''
    setDetectedLang(detectLanguage(text))
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

const MarkdownMessage = memo(function MarkdownMessage({ text }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          const safeHref = getSafeExternalUrl(href)
          if (!safeHref) {
            return <span>{children}</span>
          }

          return (
            <a href={safeHref} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          )
        },
        img: ({ alt, src }) => {
          const safeSrc = getSafeExternalUrl(src)
          if (!safeSrc) {
            return <span>{alt || 'Blocked image link'}</span>
          }

          return (
            <a href={safeSrc} target="_blank" rel="noopener noreferrer">
              {alt || safeSrc}
            </a>
          )
        },
        pre: ({ children }) => {
          const codeChild = children as React.ReactElement<{ className?: string }> | null
          const resolvedClassName = codeChild?.props?.className
          return <CodeBlock className={resolvedClassName}>{children}</CodeBlock>
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
      {text.replace(/\n/g, '  \n')}
    </ReactMarkdown>
  )
})

export default MarkdownMessage
