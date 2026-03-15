'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAuthApi, handleLoginTokens, ApiError } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await adminAuthApi.loginPassword(username.trim(), password)
      if (res.user.role !== 'ADMIN' && res.user.role !== 'MODERATOR') {
        setError('This account does not have admin rights.')
        return
      }
      handleLoginTokens(res.accessToken)
      router.replace('/')
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Workplace Buzz</h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Admin</p>
        </div>
      </div>
      <div className="admin-card w-full max-w-[380px] overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
        <div className="space-y-1.5 pb-4">
          <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
          <p className="text-sm text-muted-foreground">
            Use an administrator or moderator account to access the dashboard.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="h-10"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="h-10"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="h-10 w-full font-medium">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
      <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
        Access is restricted to accounts with admin or moderator privileges.
      </p>
    </div>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

