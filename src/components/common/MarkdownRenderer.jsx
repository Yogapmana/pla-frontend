import { useMemo, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Check, Copy, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function extractText(node) {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && node.props && node.props.children) {
    return extractText(node.props.children);
  }
  return '';
}

function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const code = extractText(children).replace(/\n$/, '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  // Treat as inline if it's explicitly inline OR if it's a very short single-line string (max 2 words)
  const wordCount = code.trim().split(/\s+/).length;
  const isActuallyInline = inline || (!code.includes('\n') && wordCount <= 2);

  if (isActuallyInline) {
    return (
      <code
        className={cn(
          'rounded border border-border bg-bg-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-accent-readable',
          className
        )}
        {...props}
      >
        {children}
      </code>
    )
  }

  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-warm-xs">
      <div className="flex items-center justify-between border-b border-border bg-bg-tertiary/40 px-4 py-2 text-xs text-secondary font-mono">
        <span className="uppercase tracking-wider">{match?.[1] || 'code'}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? 'Tersalin' : 'Salin kode'}
          className="text-secondary hover:text-tertiary"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Tersalin' : 'Salin'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed font-mono">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

function ImageLightbox({ src, alt, isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X size={32} />
      </button>
      <img
        src={src}
        alt={alt || 'Ilustrasi'}
        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {alt && (
        <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
          {alt}
        </p>
      )}
    </div>
  )
}

function PollinationsImage({ src, alt }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  return (
    <>
      <figure
        className="my-8 group cursor-zoom-in"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={src}
          alt={alt || 'Ilustrasi'}
          className="w-full rounded-xl shadow-lg border bg-surface transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-xl"
          loading="lazy"
        />
        {alt && alt !== 'Ilustrasi' && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
            {alt}
          </figcaption>
        )}
      </figure>
      <ImageLightbox
        src={src}
        alt={alt}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  )
}

function ContentWithImages({ content, className }) {
  const segments = useMemo(() => {
    if (!content) return []

    const imageRegex = /!\[([^\]]*)\]\((https:\/\/(image|gen)\.pollinations\.ai\/image\/[^)]+\?[^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match
    let idx = 0

    while ((match = imageRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        })
      }
      parts.push({
        type: 'image',
        alt: match[1],
        src: match[2],
        key: `img-${idx++}`
      })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      })
    }

    return parts
  }, [content])

  // Track whether the FIRST paragraph has been rendered (for drop cap)
  const firstParaRenderedRef = useRef(false)
  if (firstParaRenderedRef.current === false) {
    // Reset on new content
    firstParaRenderedRef.current = false
  }

  const components = useMemo(() => ({
    blockquote: ({ children }) => (
      <blockquote className="my-7 relative border-l-[3px] border-tertiary bg-tertiary/[0.04] py-4 pr-5 pl-6 italic text-secondary rounded-r-xl">
        <span
          aria-hidden="true"
          className="absolute top-3 left-2 font-display text-3xl font-black italic text-tertiary/40 leading-none"
        >
          &ldquo;
        </span>
        {children}
      </blockquote>
    ),
    code: CodeBlock,
    table: ({ children }) => <div className="my-6 w-full overflow-x-auto rounded-lg border"><table className="w-full caption-bottom text-sm">{children}</table></div>,
    th: ({ children }) => <th className="border-b bg-secondary/10 px-4 py-2.5 text-left font-semibold text-primary">{children}</th>,
    td: ({ children }) => <td className="border-b px-4 py-2.5 align-top">{children}</td>,
    p: ({ children }) => {
      const isFirst = !firstParaRenderedRef.current
      if (isFirst) firstParaRenderedRef.current = true
      return (
        <p className={cn(isFirst && 'first-paragraph-dropcap')}>
          {children}
        </p>
      )
    },
  }), [])

  return (
    <div className={cn('module-content prose prose-stone max-w-none font-serif-content leading-[1.8]', className)}>
      {segments.map((segment, i) => {
        if (segment.type === 'image') {
          return <PollinationsImage key={segment.key} src={segment.src} alt={segment.alt} />
        }
        // Reset the first-paragraph tracker at the start of each text segment
        if (i === 0 || segment.type === 'text') {
          firstParaRenderedRef.current = false
        }
        return (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeHighlight, rehypeKatex]}
            components={components}
          >
            {segment.content}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}

function MarkdownRenderer({ content, className }) {
  const processedContent = useMemo(() => {
    if (!content) return '';
    return content
      .replace(/\\\[/g, '$$$$')
      .replace(/\\\]/g, '$$$$')
      .replace(/\\\(/g, '$$')
      .replace(/\\\)/g, '$$');
  }, [content]);

  return <ContentWithImages content={processedContent} className={className} />
}

export default MarkdownRenderer
