import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 120000,
  withCredentials: true, // send/receive httpOnly auth cookies
})

api.interceptors.request.use((config) => {
  // Prefer in-memory access token (from login body) for Bearer + WebSocket bootstrap.
  // Primary session is the httpOnly cookie; Bearer is optional dual-auth.
  const storeToken = useAuthStore.getState().token
  if (storeToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${storeToken}`
  }
  return config
})

let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (!originalRequest) return Promise.reject(error)

    // Don't try to refresh the refresh/login endpoints themselves
    const url = originalRequest.url || ''
    if (
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/logout')
    ) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Refresh uses httpOnly cookie only — no body token
        const response = await api.post('/auth/refresh')
        const newToken = response.data.access_token
        useAuthStore.getState().updateToken(newToken)
        if (response.data.user) {
          useAuthStore.getState().updateUser(response.data.user)
        }
        onRefreshed(newToken)

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout({ skipServer: true })
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.replace('/login')
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
