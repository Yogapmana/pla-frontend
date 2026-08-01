import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Copy, Check, RefreshCw } from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import SourceAccordion from './SourceAccordion'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const ChatBubble = ({
  message,
  isAI,
  sources,
  timestamp,
  isLastAiMessage = false,
  onRegenerate,
  rag_faithfulness,
  rag_answer_relevancy,
  messageId,
}) => {
  const [copied, setCopied] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const formattedTime = timestamp ? format(new Date(timestamp), 'HH:mm') : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const bubbleVariants = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring', stiffness: 300, damping: 26 },
      }

  return (
    <div className={cn('group mb-6 flex flex-col', isAI ? 'items-start' : 'items-end')}>
      <div className={cn('flex gap-3 max-w-[min(100%,42rem)]', isAI ? 'flex-row' : 'flex-row-reverse')}>
        {isAI && (
          <div className="mt-0.5 shrink-0">
            <Avatar role="tutor" variant="soft" size="sm" />
          </div>
        )}

        <div className="flex min-w-0 flex-col">
          <motion.div
            {...bubbleVariants}
            className={cn(
               'px-4 py-3.5 shadow-warm-xs sm:px-5',
              isAI
                 ? 'max-w-full rounded-2xl rounded-tl-md border border-border-subtle/80 bg-surface shadow-[0_3px_12px_rgba(58,41,22,0.045)]'
                 : 'max-w-full rounded-2xl rounded-tr-md bg-tertiary text-white shadow-[0_5px_16px_rgba(154,30,22,0.18)]'
            )}
          >
            <div
              className={cn(
                'break-words text-[14px] leading-relaxed',
                isAI ? 'font-serif-content text-primary' : 'font-label text-white'
              )}
            >
              {isAI ? (
                <MarkdownRenderer content={message} />
              ) : (
                <p className="whitespace-pre-wrap">{message}</p>
              )}
            </div>
          </motion.div>

          {isAI && sources && sources.length > 0 && <SourceAccordion sources={sources} />}

          {isAI && (
            <div className="ml-0.5 mt-1.5 flex items-center gap-0.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg p-1.5 text-secondary/55 transition-colors hover:bg-surface hover:text-secondary"
                aria-label="Copy message"
              >
                {copied ? <Check size={14} className="text-success-fg" /> : <Copy size={14} />}
              </button>
              {isLastAiMessage && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="rounded-lg p-1.5 text-secondary/55 transition-colors hover:bg-surface hover:text-secondary"
                  aria-label="Regenerate answer"
                >
                  <RefreshCw size={14} />
                </button>
              )}
              {formattedTime && (
                <span className="ml-1 font-label text-[11px] tabular-nums text-secondary/50">
                  {formattedTime}
                </span>
              )}
            </div>
          )}

          {!isAI && formattedTime && (
            <span className="mr-1 mt-1 text-right font-label text-[11px] tabular-nums text-secondary/50">
              {formattedTime}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatBubble
