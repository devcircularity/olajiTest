// hooks/useAuthGuard.ts
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function useAuthGuard(redirectTo: string = '/login') {
  const { token, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return
    
    if (!token) {
      // Redirect to login with current path as next parameter
      const currentPath = window.location.pathname + window.location.search
      const loginUrl = `${redirectTo}?next=${encodeURIComponent(currentPath)}`
      router.replace(loginUrl)
    }
  }, [token, isLoading, router, redirectTo])

  return { 
    isAuthenticated: !!token && !isLoading,
    isLoading 
  }
}