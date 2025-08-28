// services/auth.ts
import { api } from './api'

type Signup = { email: string; password: string; full_name: string }
type Login = { email: string; password: string }

export const authService = {
  async signup(body: Signup) {
    const { data } = await api.post('/api/auth/register', body)
    // Store the access_token as 'token' and school_id as 'active_school_id'
    if (data.access_token) {
      localStorage.setItem('token', data.access_token)
    }
    if (data.school_id) {
      localStorage.setItem('active_school_id', String(data.school_id))
    }
    return {
      access_token: data.access_token,
      school_id: data.school_id
    }
  },
  async login(body: Login) {
    const { data } = await api.post('/api/auth/login', body)
    // Store the access_token as 'token' and school_id as 'active_school_id'
    if (data.access_token) {
      localStorage.setItem('token', data.access_token)
    }
    if (data.school_id) {
      localStorage.setItem('active_school_id', String(data.school_id))
    }
    return {
      access_token: data.access_token,
      school_id: data.school_id
    }
  },
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('active_school_id')
  }
}