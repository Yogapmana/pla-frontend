import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const ChatInput = ({
  onSend,
  onUpload,
  isLoading,
  isUploading,
  placeholder,
  hideUpload = false,
}) => {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text)
      setText('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      onUpload(file)
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [text])

  const canSend = text.trim() && !isLoading

  return (
    <div className="px-4 pb-4 md:px-8 md:pb-5">
      <div className="mx-auto max-w-4xl">
        <div
          className={cn(
            'relative flex items-end gap-2 rounded-[1.35rem] border bg-surface/95 px-3 py-2.5 sm:px-3.5 sm:py-3',
            'shadow-[0_8px_30px_rgba(58,41,22,0.08)] transition-all duration-200',
            isFocused
              ? 'border-tertiary/45 ring-2 ring-tertiary/15 shadow-warm-md'
              : 'border-border-subtle hover:border-border'
          )}
        >
          {!hideUpload && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt,.md"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isLoading}
                className={cn(
                 'mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-transparent',
                  'text-secondary/60 hover:text-tertiary hover:bg-tertiary/8',
                  'disabled:opacity-50 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/30'
                )}
                aria-label={t('chat.attach_file', 'Attach file')}
                title={t('chat.attach_file', 'Attach file')}
              >
                {isUploading ? (
                  <Loader2 className="animate-spin text-tertiary" size={18} />
                ) : (
                  <Paperclip size={18} />
                )}
              </button>
            </>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={cn(
              'flex-1 min-h-[28px] max-h-[160px] resize-none bg-transparent border-none',
              'py-1.5 text-[14px] leading-relaxed text-primary',
              'placeholder:text-secondary/45 focus:ring-0 focus:outline-none',
              '[&::-webkit-scrollbar]:hidden'
            )}
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label={t('chat.send', 'Send message')}
            className={cn(
               'mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl',
              'transition-all duration-200',
              canSend
                ? 'bg-tertiary text-white shadow-warm-sm hover:bg-tertiary-light hover:scale-[1.03]'
                : 'bg-secondary/10 text-secondary/40 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={17} className={canSend ? 'translate-x-px -translate-y-px' : ''} />
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] font-label text-secondary/45">
           {t('chat.input_hint', 'Enter untuk mengirim · Shift+Enter untuk baris baru')}
        </p>
      </div>
    </div>
  )
}

export default ChatInput
