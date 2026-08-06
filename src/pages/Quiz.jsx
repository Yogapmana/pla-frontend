import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useQuiz, useSubmitQuiz } from '@/hooks/useQuiz';
import { useToast } from '@/hooks/use-toast';
import { useLearningStore } from '@/stores/learningStore';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizResult } from '@/components/quiz/QuizResult';
import { Loader2, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button'

// Quiz generation is async: GET /quiz returns 202 → { ready:false } and
// the backend builds it in a Celery task. We poll automatically (useQuiz
// refetchInterval) and cap the wait here at 5 minutes.
const QUIZ_GEN_TIMEOUT_MS = 5 * 60_000

export function CooldownTimer({ initialSeconds, onComplete, topicId, feedbackAction }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, onComplete]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-card rounded-xl border border-border">
      <Clock className="w-12 h-12 text-primary animate-pulse" />
      <h3 className="text-xl font-bold text-primary">Jeda Kuis Aktif</h3>
      <p className="text-secondary text-center max-w-md">
        Nilai kuis Anda di bawah 80%. Silakan baca dan pelajari kembali materi sebelum mencoba kuis lagi.
      </p>
      
      <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <Button 
          variant="outline" 
          className="w-full h-11"
          onClick={() => window.location.href = `/module/${topicId}`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Baca Materi Utama
        </Button>
        {feedbackAction === 'remedial' && (
          <Button 
            variant="default" 
            className="w-full h-11 bg-tertiary hover:bg-tertiary/90 text-white"
            onClick={() => window.location.href = `/module/${topicId}/remedial`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Buka Materi Remedial
          </Button>
        )}
      </div>

      <div
        role="timer"
        aria-live="polite"
        aria-label={`Sisa waktu jeda: ${mins} menit ${secs} detik`}
        className="text-3xl font-mono font-bold text-foreground bg-muted px-6 py-3 rounded-lg"
      >
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <p className="text-sm text-tertiary">Kuis akan terbuka secara otomatis setelah waktu habis.</p>
    </div>
  );
}

export default function Quiz() {
  const { topicId } = useParams();
  const navigate = useNavigate()
  const { toast } = useToast();
  const { activeSession } = useLearningStore();
  const queryClient = useQueryClient();
  
  const { data: quizData, isLoading, error, refetch } = useQuiz(topicId);
  const submitQuiz = useSubmitQuiz();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizState, setQuizState] = useState('answering');
  const [isRevealed, setIsRevealed] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [resultQuestions, setResultQuestions] = useState(null);
  const [startTime, setStartTime] = useState(null);
  // Quiz generation polling: 202 → { ready:false } until the Celery
  // task finishes. Cap the wait at 5 minutes, then surface a retry.
  const [generationStartedAt, setGenerationStartedAt] = useState(null);
  const [generationTimedOut, setGenerationTimedOut] = useState(false);

  const clearStoredResult = () => {
    if (!topicId) return
    try {
      sessionStorage.removeItem(`quiz_result:${topicId}`)
    } catch {
      /* ignore */
    }
  };

  const retryQuizGeneration = () => {
    setGenerationStartedAt(null);
    setGenerationTimedOut(false);
    refetch();
  };

  useEffect(() => {
    if (quizData && !startTime) {
      setStartTime(Date.now());
    }
  }, [quizData, startTime]);

  // Track when we started waiting for a background quiz generator.
  useEffect(() => {
    if (!quizData || quizData.ready !== false) {
      setGenerationStartedAt(null);
      setGenerationTimedOut(false);
      return;
    }
    setGenerationStartedAt((prev) => prev ?? Date.now());
  }, [quizData]);

  // Give up waiting after QUIZ_GEN_TIMEOUT_MS so a hung generator does
  // not poll forever — surface the retry screen instead.
  useEffect(() => {
    if (generationStartedAt == null) return;
    const timer = setInterval(() => {
      if (Date.now() - generationStartedAt > QUIZ_GEN_TIMEOUT_MS) {
        setGenerationTimedOut(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [generationStartedAt]);

  // Restore the last submitted result when we come back to this topic's quiz
  // page (same tab). It shows the score instead of re-fetching — and avoids
  // triggering another expensive LLM quiz generation on remount, since the
  // submitted quiz was already consumed server-side.
  useEffect(() => {
    if (!topicId) return
    try {
      const raw = sessionStorage.getItem(`quiz_result:${topicId}`)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved?.result) {
        setQuizResult(saved.result)
        setResultQuestions(saved.questions ?? null)
        setQuizState('result')
      }
    } catch {
      /* ignore */
    }
  }, [topicId]);

  // Result screen must be checked BEFORE isLoading: if a background refetch
  // is in flight we must not swap the score reveal for the loader.
  if (quizState === 'result' && quizResult) {
    const formattedQuestions =
      resultQuestions ??
      (quizData
        ? quizData.questions.map((q, i) => ({
            ...q,
            user_answer: answers[q.id || i] || null
          }))
        : []);

    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-0">
        <QuizResult 
          result={quizResult}
          questions={formattedQuestions}
          topicId={topicId}
          sessionId={activeSession?.id}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-tertiary" />
      </div>
    );
  }

  // 202: the quiz is still being generated by a background Celery job.
  // useQuiz polls every 5s until the quiz is ready (200). After 5 min we
  // give up and offer a retry (the backend marks permanent failures with
  // a 404, which lands in the error branch below instead).
  if (quizData && quizData.ready === false) {
    if (generationTimedOut) {
      return (
        <div className="flex flex-col min-h-[60vh] items-center justify-center text-center p-4">
          <h2 className="text-xl font-bold text-primary mb-2">Gagal Membuat Kuis</h2>
          <p className="text-secondary mb-4">Kuis belum selesai dibuat. Silakan coba lagi.</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/curriculum')}>Kembali</Button>
            <Button onClick={retryQuizGeneration}>Coba Lagi</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col min-h-[60vh] items-center justify-center text-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-tertiary mb-4" />
        <h2 className="text-xl font-bold text-primary mb-2">Menyiapkan kuis...</h2>
        <p className="text-secondary">Kuis sedang dibuat oleh AI. Ini mungkin memakan waktu beberapa saat.</p>
      </div>
    );
  }

  if (error || !quizData) {
    const errorDetail = error?.response?.data?.detail;
    if (errorDetail && errorDetail.message === 'cooldown') {
      return (
        <div className="flex flex-col min-h-[60vh] items-center justify-center p-4">
          <CooldownTimer 
            initialSeconds={errorDetail.remaining_seconds} 
            onComplete={() => refetch()} 
            topicId={topicId}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-[60vh] items-center justify-center text-center p-4">
        <h2 className="text-xl font-bold text-primary mb-2">Gagal Memuat Kuis</h2>
        <p className="text-secondary mb-4">Terjadi kesalahan saat mengambil data kuis.</p>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/curriculum')}>Kembali</Button>
          <Button onClick={() => refetch()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  const handleSelectOption = (option) => {
    if (isRevealed) return;
    
    const questionId = quizData.questions[currentIndex].id || currentIndex;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
    
    setIsRevealed(true);
    setQuizState('feedback');
  };

  const handleNext = async () => {
    // From a past review jump: go to first unanswered, or submit if all done
    const statuses = quizData.questions.map((q, i) => {
      const selected = answers[q.id || i]
      if (selected === undefined || selected === null || selected === '') return 'pending'
      return selected === q.correct_answer ? 'correct' : 'wrong'
    })
    const firstPending = statuses.findIndex((s) => s === 'pending')

    if (firstPending !== -1 && firstPending !== currentIndex) {
      setCurrentIndex(firstPending)
      setIsRevealed(false)
      setQuizState('answering')
      return
    }

    if (currentIndex < quizData.questions.length - 1) {
      const next = currentIndex + 1
      setCurrentIndex(next)
      const nextQ = quizData.questions[next]
      const nextAns = answers[nextQ.id || next]
      const already = nextAns !== undefined && nextAns !== null && nextAns !== ''
      setIsRevealed(already)
      setQuizState(already ? 'feedback' : 'answering')
    } else {
      await handleSubmit()
    }
  }

  const handleJumpTo = (index) => {
    if (index < 0 || index >= quizData.questions.length) return
    const q = quizData.questions[index]
    const selected = answers[q.id || index]
    const answered = selected !== undefined && selected !== null && selected !== ''
    if (!answered) return
    setCurrentIndex(index)
    setIsRevealed(true)
    setQuizState('feedback')
  }

  const handleSubmit = async () => {
    setQuizState('submitting');
    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    const formattedAnswers = quizData.questions.map((q, i) => ({
      question_index: i,
      selected_answer: answers[q.id || i] || ""
    }));

    try {
      if (!activeSession?.id) {
        toast({
          title: "Sesi tidak ditemukan",
          description: "Silakan mulai sesi belajar terlebih dahulu.",
          variant: "destructive"
        });
        setQuizState('answering');
        return;
      }

      const sessionId = activeSession.id;
      const res = await submitQuiz.mutateAsync({
        session_id: sessionId,
        topic_id: topicId,
        quiz_id: quizData.quiz_id,  // cache key — replay-safe grading
        answers: formattedAnswers,
        time_spent_seconds: timeSpentSeconds,
        questions_data: quizData.questions
      });

      // Keep a copy of the submitted result so the score/result screen
      // survives a remount or reload during the failed-quiz cooldown gate.
      const formattedQuestions = quizData.questions.map((q, i) => ({
        ...q,
        user_answer: answers[q.id || i] || null
      }));
      setResultQuestions(formattedQuestions);
      try {
        sessionStorage.setItem(
          `quiz_result:${topicId}`,
          JSON.stringify({ result: res, questions: formattedQuestions })
        );
      } catch {
        /* ignore */
      }

      setQuizResult(res);
      setQuizState('result');
    } catch (err) {
      toast({
        title: "Gagal mengirim kuis",
        description: "Silakan coba beberapa saat lagi.",
        variant: "destructive"
      });
      setQuizState('feedback');
    }
  };

  function handleRetry() {
    clearStoredResult();
    if (topicId) {
      queryClient.removeQueries({ queryKey: ['quiz', topicId] })
    }
    setCurrentIndex(0);
    setAnswers({});
    setQuizState('answering');
    setIsRevealed(false);
    setQuizResult(null);
    setResultQuestions(null);
    setStartTime(Date.now());
    refetch();
  }

  const currentQuestion = quizData.questions[currentIndex];

  const answerStatuses = quizData.questions.map((q, i) => {
    const selected = answers[q.id || i]
    if (selected === undefined || selected === null || selected === '') {
      return 'pending'
    }
    return selected === q.correct_answer ? 'correct' : 'wrong'
  })

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-0 flex flex-col items-center">
      {quizState === 'submitting' ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Loader2 className="w-10 h-10 animate-spin text-tertiary" />
          <p className="text-secondary font-medium">Menghitung skor...</p>
        </div>
      ) : (
        <QuizCard 
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={quizData.total_questions || quizData.questions.length}
          selectedAnswer={answers[currentQuestion.id || currentIndex]}
          isRevealed={isRevealed}
          onSelectOption={handleSelectOption}
          onNext={handleNext}
          answerStatuses={answerStatuses}
          onJumpTo={handleJumpTo}
        />
      )}
    </div>
  );
}
