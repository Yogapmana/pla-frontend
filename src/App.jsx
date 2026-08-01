import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import PageLoader from './components/common/PageLoader'
import { useAuthStore } from './stores/authStore'
import { useLearningStore } from './stores/learningStore'
import { useActiveSession } from './hooks/useLearning'
import { Button } from '@/components/ui/button'

const Login = lazy(() => import('./pages/Auth/Login'))
const Register = lazy(() => import('./pages/Auth/Register'))
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Curriculum = lazy(() => import('./pages/Curriculum'))
const Module = lazy(() => import('./pages/Module'))
const Remedial = lazy(() => import('./pages/Remedial'))
const DeepDive = lazy(() => import('./pages/DeepDive'))
const Chat = lazy(() => import('./pages/Chat'))
const Quiz = lazy(() => import('./pages/Quiz'))
const QuizHistory = lazy(() => import('./pages/QuizHistory'))
const QuizHistoryByTopic = lazy(() => import('./pages/QuizHistoryByTopic'))
const Settings = lazy(() => import('./pages/Settings'))
const Onboarding = lazy(() => import('./pages/Onboarding/Onboarding'))
const OnboardingLayout = lazy(() => import('./components/layout/OnboardingLayout'))
const AgentLoadingScreen = lazy(() => import('./pages/Onboarding/AgentLoadingScreen'))
const Landing = lazy(() => import('./pages/Landing'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // data fresh 1 menit → navigasi tidak refetch
      gcTime: 10 * 60_000,      // cache 10 menit
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})

function RootRedirect() {
  const { isAuthenticated, authReady } = useAuthStore()
  if (!authReady) return <PageLoader fullScreen showLogo />
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function CurriculumRedirect() {
  const { topicId } = useParams()
  return <Navigate to={topicId ? `/module/${topicId}` : '/curriculum'} replace />
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-secondary p-4 text-center">
      <h1 className="text-6xl font-display font-bold text-tertiary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-primary mb-2">Halaman tidak ditemukan</h2>
      <p className="text-secondary max-w-md mb-8">Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
      <Button asChild variant="tertiary">
        <Link to="/">Kembali ke Beranda</Link>
      </Button>
    </div>
  )
}

function SessionGuard({ children }) {
  const { isAuthenticated, authReady } = useAuthStore()
  const activeSession = useLearningStore((s) => s.activeSession)
  const setActiveSession = useLearningStore((s) => s.setActiveSession)
  const canFetch = isAuthenticated
  // Keep previous session visible while revalidating — avoids full-page loader on every nav
  const { data: fetchedSession, isLoading, isFetching } = useActiveSession({
    enabled: canFetch,
  })
  const location = useLocation()

  React.useEffect(() => {
    if (fetchedSession && (!activeSession || activeSession.id !== fetchedSession.id)) {
      setActiveSession(fetchedSession)
    }
  }, [fetchedSession, activeSession, setActiveSession])

  if (!authReady) {
    return <PageLoader fullScreen showLogo />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Only block on FIRST load when we have no cached/store session yet
  const hasSession = !!fetchedSession || !!activeSession
  if ((isLoading || isFetching) && !hasSession) {
    return <PageLoader fullScreen showLogo />
  }

  if (fetchedSession?.status === 'processing') {
    return (
      <Suspense fallback={<PageLoader fullScreen showLogo />}>
        <AgentLoadingScreen sessionId={fetchedSession.id} />
      </Suspense>
    )
  }

  if (location.pathname === '/onboarding' && hasSession) {
    const isNewRequest = new URLSearchParams(location.search).get('new') === 'true'
    if (isNewRequest) {
      return children
    }
    const sessionStatus = fetchedSession?.status || activeSession?.status
    if (sessionStatus === 'processing') {
      return children
    }
    return <Navigate to="/dashboard" replace />
  }

  if (!hasSession && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

/** Persistent shell: SessionGuard + AppLayout stay mounted across page navigations. */
function AppShell() {
  return (
    <SessionGuard>
      <ProtectedRoute>
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </AppLayout>
      </ProtectedRoute>
    </SessionGuard>
  )
}

function OnboardingShell() {
  return (
    <SessionGuard>
      <Suspense fallback={<PageLoader fullScreen showLogo />}>
        <OnboardingLayout>
          <Outlet />
        </OnboardingLayout>
      </Suspense>
    </SessionGuard>
  )
}

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Synapsa — Personal Learning Agent';
    if (path.startsWith('/dashboard')) title = 'Dashboard — Synapsa';
    else if (path.startsWith('/curriculum')) title = 'Kurikulum — Synapsa';
    else if (path.startsWith('/module')) title = 'Modul — Synapsa';
    else if (path.startsWith('/chat')) title = 'Chat Tutor — Synapsa';
    else if (path.startsWith('/quiz')) title = 'Kuis — Synapsa';
    else if (path.startsWith('/progress')) title = 'Riwayat Kuis — Synapsa';
    else if (path.startsWith('/settings')) title = 'Pengaturan — Synapsa';
    else if (path.startsWith('/login')) title = 'Masuk — Synapsa';
    else if (path.startsWith('/register')) title = 'Daftar — Synapsa';
    else if (path.startsWith('/verify-email')) title = 'Verifikasi Email — Synapsa';
    else if (path.startsWith('/forgot-password')) title = 'Lupa Password — Synapsa';
    else if (path.startsWith('/reset-password')) title = 'Reset Password — Synapsa';
    else if (path.startsWith('/onboarding')) title = 'Onboarding — Synapsa';

    document.title = title;
  }, [location]);

  return (
    <Routes>
      {/* Public — Suspense lokal, full-screen loader OK */}
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader fullScreen showLogo />}>
            <Landing />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader fullScreen showLogo />}>
            <ErrorBoundary><Login /></ErrorBoundary>
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<PageLoader fullScreen showLogo />}>
            <ErrorBoundary><Register /></ErrorBoundary>
          </Suspense>
        }
      />
      <Route
        path="/verify-email"
        element={
          <Suspense fallback={<PageLoader fullScreen showLogo />}>
            <ErrorBoundary><VerifyEmail /></ErrorBoundary>
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<PageLoader fullScreen showLogo />}>
            <ErrorBoundary><ForgotPassword /></ErrorBoundary>
          </Suspense>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Suspense fallback={<PageLoader fullScreen showLogo />}>
            <ErrorBoundary><ResetPassword /></ErrorBoundary>
          </Suspense>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ErrorBoundary>
            <OnboardingShell />
          </ErrorBoundary>
        }
      >
        <Route index element={<Onboarding />} />
      </Route>

      {/* Authenticated — one shell for all pages (no remount sidebar/topbar) */}
      <Route
        element={
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/module/:topicId" element={<Module />} />
        <Route path="/module/:topicId/remedial" element={<Remedial />} />
        <Route path="/module/:topicId/deep-dive" element={<DeepDive />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:topicId" element={<Chat />} />
        <Route path="/quiz/:topicId" element={<Quiz />} />
        <Route path="/progress" element={<QuizHistory />} />
        <Route path="/progress/topic/:topicId" element={<QuizHistoryByTopic />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/curriculum/:topicId" element={<CurriculumRedirect />} />
      <Route path="/modules" element={<Navigate to="/curriculum" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <SpeedInsights />
        <Analytics />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
