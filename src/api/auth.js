import api from './client'

export function login(email, password) {
  const body = new URLSearchParams({
    username: email,
    password,
  })

  return api
    .post('/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((response) => response.data)
}

export function register({ username, email, password }) {
  return api
    .post('/auth/register', { username, email, password })
    .then((response) => response.data)
}

export function verifyEmail(email, code) {
  return api.post('/auth/verify-email', { email, code }).then((response) => response.data)
}

export function resendVerification(email) {
  return api.post('/auth/resend-verification', { email }).then((response) => response.data)
}

export function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email }).then((response) => response.data)
}

export function resetPassword(token, password) {
  return api.post('/auth/reset-password', { token, password }).then((response) => response.data)
}

export function getMe() {
  return api.get('/auth/me').then((response) => response.data)
}

export function refreshSession() {
  return api.post('/auth/refresh').then((response) => response.data)
}

export function logoutApi() {
  return api.post('/auth/logout').then((response) => response.data)
}

export function updateProfile({ username }) {
  return api.patch('/auth/me', { username }).then((response) => response.data)
}

export function updateLanguagePreference(language_preference) {
  return api
    .put('/auth/me/language', { language_preference })
    .then((response) => response.data)
}

export function deleteAccount() {
  return api.delete('/auth/me').then((response) => response.data)
}

export function googleLogin(credential) {
  return api.post('/auth/google', { credential }).then((response) => response.data)
}
