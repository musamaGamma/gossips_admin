'use client'

import { useState } from 'react'
import { adminNotificationsApi, ApiError } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SendNotificationPage() {
  const [message, setMessage] = useState('')
  const [sendTo, setSendTo] = useState<'all' | 'select'>('all')
  const [usernamesInput, setUsernamesInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    const trimmed = message.trim()
    if (!trimmed) {
      setError('Message is required')
      return
    }
    if (sendTo === 'select') {
      const list = usernamesInput.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean)
      if (list.length === 0) {
        setError('Enter at least one username')
        return
      }
    }
    setLoading(true)
    try {
      const body = sendTo === 'all'
        ? { message: trimmed, all: true }
        : { message: trimmed, usernames: usernamesInput.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean) }
      const res = await adminNotificationsApi.send(body)
      setResult({ sent: res.sent, total: res.total })
      setMessage('')
      setUsernamesInput('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Send notification</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Send an announcement to all users or selected users. They will see it in-app. Browser push is only sent to users who have enabled push in the app (Profile → Push notifications) and allowed the browser permission when prompted.
        </p>
      </div>

      <Card className="admin-card max-w-xl">
        <CardHeader className="border-border/50">
          <CardTitle className="text-base font-semibold">Compose</CardTitle>
          <CardDescription>Message is shown as a notification and in the notifications list (max 500 characters).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. We'll be doing maintenance tonight at 10 PM."
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">{message.length}/500</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Send to</label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendTo"
                    checked={sendTo === 'all'}
                    onChange={() => setSendTo('all')}
                    className="rounded border-border"
                  />
                  <span className="text-sm">All users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendTo"
                    checked={sendTo === 'select'}
                    onChange={() => setSendTo('select')}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Select users (by username)</span>
                </label>
                {sendTo === 'select' && (
                  <input
                    type="text"
                    value={usernamesInput}
                    onChange={(e) => setUsernamesInput(e.target.value)}
                    placeholder="user1, user2, user3"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {result && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                Sent to {result.sent} of {result.total} user{result.total !== 1 ? 's' : ''}.
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send notification'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
