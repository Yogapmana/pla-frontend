import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { OptionButton } from './OptionButton';
import { QuizFeedback } from './QuizFeedback';
import { Check, X } from 'lucide-react';

function dotClass(status, isCurrent) {
  if (status === 'correct') return 'w-6 bg-success'
  if (status === 'wrong') return 'w-6 bg-danger'
  if (isCurrent) return 'w-8 bg-tertiary animate-pulse'
  return 'w-2 bg-border'
}

/**
 * QuizCard — question + options + progress dots.
 * Dot answered → klik review (read-only).
 */
export function QuizCard({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  isRevealed,
  onSelectOption,
  onNext,
  answerStatuses = [],
  onJumpTo,
}) {
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100

  const correctCount = answerStatuses.filter((s) => s === 'correct').length
  const wrongCount = answerStatuses.filter((s) => s === 'wrong').length
  const answeredCount = correctCount + wrongCount

  return (
    <motion.div
      key={`question-${currentIndex}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto relative"
    >
      {/* Header: counter + summary + dots */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-5xl font-black italic text-tertiary leading-none tabular-nums">
            {String(currentIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-sm font-label uppercase tracking-widest text-secondary">
            dari {totalQuestions}
          </span>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {/* Live Benar / Salah summary */}
          <div
            className="flex items-center gap-3 text-xs font-label tabular-nums"
            aria-live="polite"
            aria-label={`Benar ${correctCount}, salah ${wrongCount}, dijawab ${answeredCount} dari ${totalQuestions}`}
          >
            <span className="inline-flex items-center gap-1 text-success-fg">
              <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              Benar {correctCount}
            </span>
            <span className="text-secondary/30" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-danger-fg">
              <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              Salah {wrongCount}
            </span>
          </div>

          {/* Stepped dots — click answered to review */}
          <div
            className="flex items-center gap-1.5"
            role="list"
            aria-label="Status jawaban per soal. Klik soal yang sudah dijawab untuk meninjau."
          >
            {Array.from({ length: totalQuestions }).map((_, i) => {
              const isCurrent = i === currentIndex
              let status = answerStatuses[i] || 'pending'
              if (isCurrent && !isRevealed) status = 'pending'
              const canJump = status === 'correct' || status === 'wrong'
              const label =
                status === 'correct'
                  ? `Soal ${i + 1}: benar`
                  : status === 'wrong'
                    ? `Soal ${i + 1}: salah`
                    : isCurrent
                      ? `Soal ${i + 1}: sedang dikerjakan`
                      : `Soal ${i + 1}: belum dijawab`

              const className =
                'h-2.5 min-w-[10px] rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 ' +
                dotClass(status, isCurrent) +
                (canJump && !isCurrent
                  ? ' cursor-pointer hover:opacity-80'
                  : isCurrent
                    ? ''
                    : ' cursor-default')

              if (canJump && onJumpTo) {
                return (
                  <button
                    key={i}
                    type="button"
                    role="listitem"
                    title={label + (isCurrent ? '' : ' — klik untuk tinjau')}
                    aria-label={label + (isCurrent ? '' : ', tinjau')}
                    aria-current={isCurrent ? 'step' : undefined}
                    disabled={isCurrent}
                    onClick={() => onJumpTo(i)}
                    className={className}
                  />
                )
              }

              return (
                <span
                  key={i}
                  role="listitem"
                  title={label}
                  aria-label={label}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={className}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="relative card-hero p-6 md:p-8 overflow-hidden">
        <span
          aria-hidden="true"
          className="absolute -top-4 -right-2 font-display text-[7rem] font-black italic text-tertiary/[0.05] leading-none pointer-events-none select-none"
        >
          Q
        </span>

        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-tertiary/40">
          <motion.div
            className="h-full bg-tertiary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="relative z-10">
          <div className="prose prose-stone max-w-none mb-7 font-serif-content leading-[1.7]">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-lg md:text-xl text-primary font-medium leading-snug">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-primary">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-tertiary">{children}</em>
                ),
              }}
            >
              {question.question}
            </ReactMarkdown>
          </div>

          <div className="space-y-2.5" role="group" aria-label="Pilihan jawaban">
            {question.options.map((option, index) => (
              <OptionButton
                key={index}
                option={option}
                index={index}
                isSelected={selectedAnswer === option}
                isCorrect={option === question.correct_answer}
                isRevealed={isRevealed}
                onClick={() => onSelectOption(option)}
                disabled={isRevealed}
              />
            ))}
          </div>

          {isRevealed && (
            <QuizFeedback
              explanation={question.explanation}
              isLastQuestion={currentIndex === totalQuestions - 1}
              onNext={onNext}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
