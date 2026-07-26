import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, X, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import StepIllustration from './StepIllustration'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 3
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function StepUpload({ data, onChange }) {
  const { t } = useTranslation()
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const fileInputRef = useRef(null)
  const files = data.files || []

  const addFiles = useCallback(
    (incoming) => {
      setValidationError(null)

      const newFiles = []
      for (const file of incoming) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          // Fallback check for .docx and .txt extensions just in case the mime type is missing
          const ext = file.name.split('.').pop().toLowerCase()
          if (!['pdf', 'docx', 'txt'].includes(ext)) {
            setValidationError('Hanya file PDF, DOCX, dan TXT yang didukung.')
            return
          }
        }
        if (file.size > MAX_FILE_SIZE) {
          setValidationError(`File "${file.name}" melebihi batas 10MB.`)
          return
        }
        newFiles.push(file)
      }

      if (files.length + newFiles.length > MAX_FILES) {
        setValidationError(`Maksimal ${MAX_FILES} file yang bisa diupload.`)
        return
      }

      onChange({ files: [...files, ...newFiles] })
    },
    [files, onChange]
  )

  const removeFile = useCallback(
    (index) => {
      const updated = files.filter((_, i) => i !== index)
      onChange({ files: updated })
      setValidationError(null)
    },
    [files, onChange]
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileInput = (e) => {
    addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  return (
    <div className="space-y-7 relative">
      {/* Header */}
      <div className="space-y-4 text-center">
        <StepIllustration variant="upload" />
        <div className="flex justify-center">
          <span className="eyebrow">{t('onboarding.upload_title')}</span>
        </div>
        <p className="text-secondary max-w-md mx-auto leading-relaxed font-serif-content">
          {t('onboarding.upload_subtitle')}
        </p>
      </div>

      {/* Drop zone */}
      <motion.div
        animate={
          isDragOver
            ? { scale: 1.01, borderColor: 'rgb(196, 37, 28)' }
            : { scale: 1 }
        }
        transition={{ duration: 0.2 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all duration-200',
          isDragOver
            ? 'border-tertiary bg-tertiary/[0.04]'
            : 'border-border bg-surface hover:border-tertiary/40 hover:bg-tertiary/[0.02]'
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tertiary/10">
          <Upload className="h-7 w-7 text-tertiary" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-primary">
            {t('onboarding.upload_placeholder')}
          </p>
          <p className="text-xs text-secondary font-label">
            PDF, DOCX, TXT · maks 10MB per file · hingga {MAX_FILES} file
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </motion.div>

      {/* Validation error */}
      {validationError && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/[0.06] p-3.5"
        >
          <AlertCircle className="h-4 w-4 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">{validationError}</p>
        </motion.div>
      )}

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <p className="font-label text-xs uppercase tracking-wider text-secondary">
              File terupload
            </p>
            <span className="font-label text-[10px] text-tertiary tabular-nums">
              {files.length}/{MAX_FILES}
            </span>
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tertiary/10">
                  <FileText className="h-5 w-5 text-tertiary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">
                    {file.name}
                  </p>
                  <p className="text-xs text-secondary tabular-nums">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
                  aria-label={`Hapus ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Helper note */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-bg-secondary/50 p-4">
        <Sparkles className="h-4 w-4 text-tertiary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">
            Upload bersifat opsional
          </p>
          <p className="text-xs text-secondary leading-relaxed">
            Bisa langsung lanjut tanpa upload. Synapsa akan mencari materi
            dari sumber terpercaya secara otomatis.
          </p>
        </div>
      </div>
    </div>
  )
}