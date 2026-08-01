import { cn } from '@/lib/utils'
import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  sendMessage,
  getHistory,
  uploadDocument,
} from '@/api/chat'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import WelcomeHero from '@/components/chat/WelcomeHero'
import ChatHistoryEmpty from '@/components/chat/ChatHistoryEmpty'
import ThinkingIndicator from '@/components/chat/ThinkingIndicator'
import {
  Sparkles,
  Plus,
  MessageCircle,
  Trash2,
  Menu,
  X,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const pageStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 26 },
  },
}

const listStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

export default function Chat() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { activeChatSessionId, setActiveChatSessionId } = useChatStore()
  const { user } = useAuthStore()
  const messagesEndRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  const [uploadToast, setUploadToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: getChatSessions,
  })

  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['chat', 'general', activeChatSessionId],
    queryFn: () => getHistory(activeChatSessionId, null),
    enabled: !!activeChatSessionId,
  })

  const createSessionMutation = useMutation({
    mutationFn: createChatSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      setActiveChatSessionId(data.id)
      setSidebarOpen(false)
    },
  })

  const deleteSessionMutation = useMutation({
    mutationFn: deleteChatSession,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      if (activeChatSessionId === deletedId) {
        setActiveChatSessionId(null)
      }
    },
  })

  const sendMutation = useMutation({
    mutationFn: ({ sessionId, content }) =>
      sendMessage({
        session_id: sessionId,
        topic_id: null,
        message: content,
        include_sources: true,
      }),
    onMutate: async ({ sessionId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['chat', 'general', sessionId] })
      const previousHistory = queryClient.getQueryData(['chat', 'general', sessionId])

      const optimisticMessage = {
        id: 'optimistic-user',
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData(['chat', 'general', sessionId], (old = []) => [
        ...old,
        optimisticMessage,
      ])
      return { previousHistory, sessionId }
    },
    onError: (err, variables, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(
          ['chat', 'general', context.sessionId],
          context.previousHistory
        )
      }

      if (err.response?.status === 404) {
        setActiveChatSessionId(null)
        setUploadToast({
          type: 'error',
          message: t(
            'chat.invalid_session',
            'Sesi percakapan tidak valid. Silakan coba kirim ulang.'
          ),
        })
      } else {
        setUploadToast({
          type: 'error',
          message:
            err.response?.data?.detail ||
            t('chat.send_failed', 'Gagal mengirim pesan (Timeout/Error)'),
        })
      }

      setTimeout(() => setUploadToast(null), 4000)
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(['chat', 'general', context.sessionId], (old = []) => {
        const filtered = old.filter((msg) => msg.id !== 'optimistic-user')
        const aiMessage = {
          id: data.message_id || `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          sources: data.sources,
          created_at: new Date().toISOString(),
        }
        return [...filtered, aiMessage]
      })
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, sessionId }) => uploadDocument(file, sessionId, null),
    onSuccess: (data, variables) => {
      setUploadToast({
        type: 'success',
        message: t('chat.upload_success', 'Dokumen berhasil diunggah dan diindeks!'),
      })
      setTimeout(() => setUploadToast(null), 4000)
      queryClient.invalidateQueries({
        queryKey: ['chat', 'general', variables.sessionId],
      })
    },
    onError: (err) => {
      setUploadToast({
        type: 'error',
        message:
          err.response?.data?.detail || t('chat.upload_failed', 'Gagal mengunggah dokumen'),
      })
      setTimeout(() => setUploadToast(null), 4000)
    },
  })

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history, sendMutation.isPending])

  const handleSendMessage = async (content) => {
    let currentSessionId = activeChatSessionId
    if (!currentSessionId) {
      const newSession = await createSessionMutation.mutateAsync(
        content.substring(0, 30) + '...'
      )
      currentSessionId = newSession.id
    }
    sendMutation.mutate({ sessionId: currentSessionId, content })
  }

  const handleUploadDocument = async (file) => {
    let currentSessionId = activeChatSessionId
    if (!currentSessionId) {
      const newSession = await createSessionMutation.mutateAsync(
        t('chat.new_document', 'Dokumen Baru')
      )
      currentSessionId = newSession.id
    }
    uploadMutation.mutate({ file, sessionId: currentSessionId })
  }

  const handleRegenerate = () => {
    const lastUserMessage = [...history].reverse().find((msg) => msg.role === 'user')
    if (lastUserMessage && activeChatSessionId) {
      sendMutation.mutate({
        sessionId: activeChatSessionId,
        content: lastUserMessage.content,
      })
    }
  }

  const isEmpty = history.length === 0 && !isHistoryLoading
  const activeSession = sessions.find((s) => s.id === activeChatSessionId)
  const headerTitle = activeSession?.topic || t('chat.title', 'Ask Synapsa Chatbot')

  const SidebarContent = () => (
    <>
      <div className="flex h-[4.25rem] shrink-0 items-center bg-surface/45 px-3 shadow-[inset_0_-1px_0_rgba(58,41,22,0.06)]">
        <button
          type="button"
          onClick={() => {
            setActiveChatSessionId(null)
            setSidebarOpen(false)
          }}
          className="group flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-tertiary/25 bg-tertiary/[0.06] px-3 font-label text-[12px] font-semibold text-tertiary transition-all hover:-translate-y-px hover:bg-tertiary/10 hover:shadow-warm-xs"
        >
          <Plus size={16} />
          {t('chat.new_chat', 'New Conversation')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-surface/20 px-2.5 pb-4 pt-4">
        {sessions.length === 0 ? (
          <ChatHistoryEmpty onTemplateClick={handleSendMessage} />
        ) : (
          <motion.div
            className="space-y-0.5"
            variants={shouldReduceMotion ? undefined : listStagger}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="show"
          >
            <p className="mb-2 px-2 text-[10px] font-label font-semibold uppercase tracking-[0.16em] text-secondary/55">
              {t('chat.recent', 'Recent')}
            </p>
            {sessions.map((session) => {
              const isActive = activeChatSessionId === session.id
              return (
                <motion.div
                  key={session.id}
                  variants={shouldReduceMotion ? undefined : fadeUp}
                  className={cn(
                    'group mb-1 flex cursor-pointer items-center justify-between rounded-xl border border-transparent px-2.5 py-2.5 transition-all duration-150',
                    isActive
                      ? 'border-tertiary/15 bg-tertiary/[0.08] text-primary font-medium shadow-warm-xs'
                      : 'text-secondary hover:border-border-subtle/60 hover:bg-surface hover:text-primary'
                  )}
                  onClick={() => {
                    setActiveChatSessionId(session.id)
                    setSidebarOpen(false)
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <MessageCircle
                      size={14}
                      className={cn(
                        'shrink-0',
                        isActive ? 'text-tertiary' : 'text-secondary/50'
                      )}
                    />
                     <span className="truncate font-label text-[13px]">{session.topic}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSessionMutation.mutate(session.id)
                    }}
                    className="shrink-0 rounded-md p-1.5 opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                    aria-label={`Delete conversation ${session.topic}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </>
  )

  return (
    <motion.div
      className="relative flex h-full min-h-0 overflow-hidden bg-transparent"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
    >
<AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-primary/35 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main chat column */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
         <header className="z-20 flex min-h-[4.25rem] shrink-0 items-center justify-between gap-4 border-b border-border-subtle/55 bg-neutral/85 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-ml-1 flex size-9 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10 hover:text-primary md:hidden"
              aria-label={t('chat.show_history', 'Show history')}
            >
              <Menu size={20} />
            </button>

             <div className="min-w-0">
               <h1 className="break-words font-display text-[16px] font-semibold leading-snug tracking-tight text-tertiary sm:text-[17px]">
                 {headerTitle}
               </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveChatSessionId(null)
                setSidebarOpen(false)
              }}
               className="hidden items-center gap-1.5 rounded-xl border border-border-subtle/60 bg-surface/35 px-3 py-2 font-label text-[12px] font-semibold text-secondary transition-all hover:border-tertiary/25 hover:bg-surface hover:text-tertiary sm:inline-flex"
            >
              <Plus size={14} />
              {t('chat.new', 'New')}
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                'hidden size-9 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10 hover:text-primary md:flex',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/30'
              )}
              title={
                sidebarCollapsed
                  ? t('chat.show_history', 'Show history')
                  : t('chat.hide_history', 'Hide history')
              }
              aria-label={
                sidebarCollapsed
                  ? t('chat.show_history', 'Show history')
                  : t('chat.hide_history', 'Hide history')
              }
            >
              {sidebarCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
            </button>
          </div>
        </header>

        {/* Messages / empty — independent scroll */}
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div
            className={cn(
              'mx-auto flex min-h-full max-w-4xl flex-col px-4 md:px-8',
              isEmpty ? 'justify-center py-10 md:py-14' : 'py-5 md:py-6'
            )}
          >
            <AnimatePresence mode="wait">
              {isEmpty ? (
                <motion.div
                  key="empty"
                  variants={shouldReduceMotion ? undefined : pageStagger}
                  initial={shouldReduceMotion ? false : 'hidden'}
                  animate="show"
                  exit={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: 0, y: -8, transition: { duration: 0.18 } }
                  }
                  className="flex flex-1 flex-col items-center justify-center"
                >
                  <WelcomeHero username={user?.username || user?.name} />
                </motion.div>
              ) : (
                <motion.div
                  key="messages"
                  variants={shouldReduceMotion ? undefined : pageStagger}
                  initial={shouldReduceMotion ? false : 'hidden'}
                  animate="show"
                  className="flex flex-1 flex-col gap-0.5 pb-2"
                >
                  {history.map((msg, index) => {
                    const isLastAi =
                      msg.role === 'assistant' &&
                      index === history.length - 1 &&
                      !sendMutation.isPending
                    return (
                      <motion.div
                        key={msg.id}
                        variants={shouldReduceMotion ? undefined : fadeUp}
                      >
                        <ChatBubble
                          messageId={msg.id}
                          message={msg.content}
                          isAI={msg.role === 'assistant'}
                          sources={msg.sources}
                          timestamp={msg.created_at}
                          isLastAiMessage={isLastAi}
                          onRegenerate={isLastAi ? handleRegenerate : undefined}
                          rag_faithfulness={msg.rag_faithfulness}
                          rag_answer_relevancy={msg.rag_answer_relevancy}
                        />
                      </motion.div>
                    )
                  })}

                  {sendMutation.isPending && (
                    <motion.div variants={shouldReduceMotion ? undefined : fadeUp}>
                      <ThinkingIndicator
                        message={t('chat.thinking', 'Memikirkan jawaban...')}
                      />
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Composer — no solid divider; soft fade into messages */}
         <div className="relative z-20 shrink-0 bg-gradient-to-t from-neutral via-neutral/95 to-transparent pt-4">
          <AnimatePresence>
            {uploadToast && (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className={cn(
                  'absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-warm-sm',
                  uploadToast.type === 'success'
                    ? 'bg-surface text-primary'
                    : 'bg-surface text-danger'
                )}
              >
                {uploadToast.type === 'success' ? (
                  <Sparkles size={16} className="text-tertiary" />
                ) : null}
                {uploadToast.message}
              </motion.div>
            )}
          </AnimatePresence>

          <ChatInput
            onSend={handleSendMessage}
            onUpload={handleUploadDocument}
            isLoading={sendMutation.isPending || createSessionMutation.isPending}
            isUploading={uploadMutation.isPending}
            placeholder={t(
              'chat.input_placeholder',
              'Tanya apapun atau unggah dokumen...'
            )}
          />
        </div>
      </div>

      {/* History sidebar — soft inset hairline instead of solid border */}
      <aside
        className={cn(
          // Mobile: drawer below topbar (z-20 < Topbar z-40 so notif stays on top).
          // Desktop: static in flex row — no viewport overlay.
           'fixed top-[60px] bottom-0 right-0 z-20 flex min-h-0 flex-col border-l border-border-subtle/55 bg-neutral/95 backdrop-blur-md',
          'shadow-[inset_1px_0_0_rgba(58,41,22,0.06)]',
          'transition-all duration-300 ease-in-out md:static md:top-auto md:z-auto',
          'w-[min(20rem,88vw)] md:h-full',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
          sidebarCollapsed && 'md:w-0 md:overflow-hidden md:shadow-none'
        )}
        aria-label={t('chat.chat_history', 'Chat history')}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4 shadow-[inset_0_-1px_0_rgba(58,41,22,0.06)] md:hidden">
          <span className="font-display font-semibold text-primary">
            {t('chat.chat_history', 'Chat history')}
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-2 text-secondary transition-colors hover:bg-secondary/10 hover:text-primary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <SidebarContent />
        </div>
      </aside>
    </motion.div>
  )
}
