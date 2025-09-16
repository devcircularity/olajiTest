'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService, UserInfo } from '@/services/auth'

type AuthState = { 
  token: string | null
  active_school_id: string | null
  user: UserInfo | null
  isLoading: boolean
}

type AuthContextType = AuthState & {
  login: (data: { token: string }) => Promise<void>
  logout: () => void
  setSchoolId: (schoolId: string) => void
  isAuthenticated: boolean
}

const AuthCtx = createContext<AuthContextType>({
  token: null,
  active_school_id: null,
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  setSchoolId: () => {},
  isAuthenticated: false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ 
    token: null, 
    active_school_id: null,
    user: null,
    isLoading: true
  })
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      const sid = localStorage.getItem('active_school_id')
      
      if (token) {
        authService.storeToken(token)
        
        try {
          const user = await authService.getCurrentUser()
          setState({ 
            token, 
            active_school_id: sid,
            user,
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to fetch user data:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('active_school_id')
          setState({ 
            token: null, 
            active_school_id: null,
            user: null,
            isLoading: false 
          })
        }
      } else {
        setState({ 
          token: null, 
          active_school_id: null,
          user: null,
          isLoading: false 
        })
      }
    }

    initializeAuth()
  }, [])

  const login = async (data: { token: string }) => {
    localStorage.setItem('token', data.token)
    authService.storeToken(data.token)
    
    try {
      const user = await authService.getCurrentUser()
      setState(prev => ({ 
        ...prev, 
        token: data.token, 
        user,
        isLoading: false 
      }))
      
      // Route user after successful login based on their role
      if (user.roles?.includes("TESTER")) {
        router.replace("/tester");
      } else if (user.permissions?.is_admin || user.permissions?.is_super_admin) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error('Failed to fetch user data after login:', error)
      setState(prev => ({ 
        ...prev, 
        token: data.token, 
        user: null,
        isLoading: false 
      }))
      throw error; // Re-throw so login form can handle the error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('active_school_id')
    authService.logout()
    setState({ 
      token: null, 
      active_school_id: null, 
      user: null,
      isLoading: false 
    })
    router.replace('/login')
  }

  const setSchoolId = (schoolId: string) => {
    localStorage.setItem('active_school_id', schoolId)
    authService.storeSchoolId(schoolId)
    setState(prev => ({ ...prev, active_school_id: schoolId }))
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    setSchoolId,
    isAuthenticated: !!state.token && !!state.user && !state.isLoading
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)

// Re-export UserInfo type for consistency
export type { UserInfo } from '@/services/auth'