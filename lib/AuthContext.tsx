'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AuthUser {
  username: string
  role: 'admin' | 'customer'
  customer_id: number | null
  token: string
}

interface AuthCtx {
  user: AuthUser | null
  setUser: (u: AuthUser | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({ user: null, setUser: () => {}, logout: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth_user')
      if (raw) setUserState(JSON.parse(raw))
    } catch {}
  }, [])

  const setUser = (u: AuthUser | null) => {
    setUserState(u)
    if (u) {
      localStorage.setItem('auth_user', JSON.stringify(u))
      localStorage.setItem('token', u.token)
    } else {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('token')
    }
  }

  const logout = () => {
    setUser(null)
    router.push('/login')
  }

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
