import { Loader2 } from 'lucide-react'

/** Compact inline loader for route transitions (keeps chrome visible). */
function PageLoader({ showLogo = false, fullScreen = false }) {
  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-screen items-center justify-center bg-background px-4'
          : 'flex min-h-[40vh] w-full items-center justify-center px-4 py-12'
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {showLogo ? (
          <div className="text-2xl font-bold tracking-[0.2em] text-primary animate-pulse">
            Synapsa
          </div>
        ) : null}
        <Loader2 className="size-7 animate-spin text-tertiary" />
        <p className="text-sm text-secondary font-label">Memuat…</p>
      </div>
    </div>
  )
}

export default PageLoader
