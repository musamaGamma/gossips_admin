'use client'

import { useEffect, useState } from 'react'
import { adminPointsConfigApi } from '../lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SCALAR_KEYS = [
  'SIGNUP_BONUS',
  'PROFILE_EDIT_COST',
  'HISTORY_DELETE_COST',
  'THREAD_CREATE_COST',
  'UPDATE_POST_COST',
  'COMMENT_REWARD',
  'FOLLOW_USER_COST',
  'AD_WATCH_REWARD',
  'AD_WATCH_MAX_PER_DAY',
] as const

const SCALAR_LABELS: Record<string, string> = {
  SIGNUP_BONUS: 'Signup bonus (pts)',
  PROFILE_EDIT_COST: 'Profile edit cost (pts)',
  HISTORY_DELETE_COST: 'History delete cost (pts)',
  THREAD_CREATE_COST: 'Thread create cost (pts)',
  UPDATE_POST_COST: 'Update post cost (pts)',
  COMMENT_REWARD: 'Comment reward (pts)',
  FOLLOW_USER_COST: 'Follow user cost (pts)',
  AD_WATCH_REWARD: 'Ad watch reward (pts)',
  AD_WATCH_MAX_PER_DAY: 'Ad watches max per day',
}

export default function PointsConfigPage() {
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, number>>({})
  const [streakDraft, setStreakDraft] = useState<string>('')

  useEffect(() => {
    adminPointsConfigApi
      .get()
      .then((res) => {
        setConfig(res.config ?? {})
        const c = res.config as { STREAK_REWARDS?: number[] }
        if (Array.isArray(c?.STREAK_REWARDS)) {
          setStreakDraft(c.STREAK_REWARDS.join(', '))
        }
      })
      .catch(() => setConfig({}))
      .finally(() => setLoading(false))
  }, [])

  const getScalar = (key: string): number => {
    const d = draft[key]
    if (d !== undefined) return d
    const v = (config as Record<string, number>)[key]
    return typeof v === 'number' ? v : 0
  }

  const setScalar = (key: string, value: number) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveScalars = async () => {
    setSaving(true)
    setError(null)
    const updates: Record<string, number> = {}
    for (const key of SCALAR_KEYS) {
      const v = draft[key] ?? (config as Record<string, number>)[key]
      if (typeof v === 'number') updates[key] = v
    }
    try {
      const res = await adminPointsConfigApi.update(updates)
      setConfig(res.config ?? {})
      setDraft({})
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStreak = async () => {
    const arr = streakDraft
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n))
    if (arr.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await adminPointsConfigApi.update({ STREAK_REWARDS: arr })
      setConfig(res.config ?? {})
      const c = res.config as { STREAK_REWARDS?: number[] }
      if (Array.isArray(c?.STREAK_REWARDS)) setStreakDraft(c.STREAK_REWARDS.join(', '))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const hasScalarChanges = SCALAR_KEYS.some(
    (k) => draft[k] !== undefined && draft[k] !== (config as Record<string, number>)[k]
  )

  return (
    <div className="relative space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Points & rewards</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Edit point rewards and costs. Changes apply after save (e.g. next signup, ad watch, thread create).
        </p>
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading ? (
        <div className="admin-card overflow-hidden">
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      ) : (
        <>
          <Card className="admin-card border-border/50">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">Rewards & costs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Scalar values (numbers). Save to apply.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SCALAR_KEYS.map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      {SCALAR_LABELS[key] ?? key}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={getScalar(key)}
                      onChange={(e) => setScalar(key, parseInt(e.target.value, 10) || 0)}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
              {hasScalarChanges && (
                <Button
                  className="mt-4"
                  onClick={handleSaveScalars}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save rewards & costs'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="admin-card border-border/50">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">Daily streak rewards</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comma-separated list: reward for day 1, day 2, … (up to 10 values).
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <Input
                value={streakDraft}
                onChange={(e) => setStreakDraft(e.target.value)}
                placeholder="e.g. 2, 3, 4, 5, 6, 7, 8, 9, 10, 10"
                className="font-mono"
              />
              <Button
                className="mt-4"
                variant="secondary"
                onClick={handleSaveStreak}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save streak rewards'}
              </Button>
            </CardContent>
          </Card>

          <Card className="admin-card border-border/50">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">Profile add rewards</CardTitle>
              <p className="text-sm text-muted-foreground">
                Points awarded when a user adds a profile field (bio, age, etc.). Edit via API or DB if needed; defaults are used when not overridden.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Keys: bio, age, gender, city, interests, education, workField, hasPhoto, workEmailVerified, weight, height, ethnicity, eyeColor, hairColor, mbti, sexuality. To change these, use the API PATCH with <code className="rounded bg-muted px-1">PROFILE_ADD: &#123; bio: 6, … &#125;</code>.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
