import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import PageLoader from '../common/PageLoader'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authReady } = useAuthStore()
  const location = useLocation()

  if (!authReady) {
    return <PageLoader fullScreen showLogo />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
