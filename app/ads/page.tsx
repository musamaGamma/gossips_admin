'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminAdsApi, type Ad } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiError } from '../lib/api'

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     'bg-muted text-muted-foreground border border-border',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
}

const PLACEMENT_LABELS: Record<string, { label: string; icon: string }> = {
  FEED:          { label: 'Thread Feed',         icon: '📰' },
  STORE:         { label: 'Store — Watch Ad',    icon: '🏪' },
  NOTIFICATIONS: { label: 'Notifications',       icon: '🔔' },
  CHAT:          { label: 'Chat — Waiting',      icon: '💬' },
  INLINE:        { label: 'Inline (legacy)',      icon: '▪️' },
  COMMENTS:      { label: 'Comments (legacy)',   icon: '▪️' },
}

const FORMAT_LABELS: Record<string, { label: string; color: string }> = {
  BANNER: { label: 'Text / Image',  color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25' },
  PUZZLE: { label: 'Puzzle',        color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25' },
  VIDEO:  { label: 'Video',         color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25' },
  SURVEY: { label: 'Survey',        color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25' },
}

const PLACEMENT_OPTIONS = [
  { value: '', label: 'All placements' },
  { value: 'FEED', label: '📰 Thread Feed' },
  { value: 'STORE', label: '🏪 Store — Watch Ad' },
  { value: 'NOTIFICATIONS', label: '🔔 Notifications' },
  { value: 'CHAT', label: '💬 Chat — Waiting' },
  { value: 'INLINE', label: 'Inline (legacy)' },
  { value: 'COMMENTS', label: 'Comments (legacy)' },
]

const FORMAT_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'BANNER', label: 'Text / Image' },
  { value: 'PUZZLE', label: 'Puzzle' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'SURVEY', label: 'Survey' },
]

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  const [filterPlacement, setFilterPlacement] = useState('')
  const [filterFormat, setFilterFormat] = useState('')

  const filteredAds = ads.filter((ad) => {
    if (filterPlacement && ad.placement !== filterPlacement) return false
    if (filterFormat && (ad.format ?? 'BANNER') !== filterFormat) return false
    return true
  })

  const fetchAds = () => {
    setLoading(true)
    adminAdsApi
      .list()
      .then((res) => setAds(res.ads ?? []))
      .catch(() => setAds([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAds() }, [])

  const handlePublish = async (ad: Ad) => {
    setActioning(ad.id)
    try { await adminAdsApi.publish(ad.id); fetchAds() }
    catch (e) { if (e instanceof ApiError) alert(e.message) }
    finally { setActioning(null) }
  }

  const handleUnpublish = async (ad: Ad) => {
    setActioning(ad.id)
    try { await adminAdsApi.unpublish(ad.id); fetchAds() }
    catch (e) { if (e instanceof ApiError) alert(e.message) }
    finally { setActioning(null) }
  }

  const handleDelete = async (ad: Ad) => {
    if (!confirm(`Delete ad "${ad.title}"?`)) return
    setActioning(ad.id)
    try { await adminAdsApi.delete(ad.id); fetchAds() }
    catch (e) { if (e instanceof ApiError) alert(e.message) }
    finally { setActioning(null) }
  }

  return (
    <div className="relative space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Ads</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage ads shown across the app — feed, store, notifications, and chat.
          </p>
        </div>
        <Button asChild>
          <Link href="/ads/new">Create ad</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="admin-card border-border/60">
        <CardContent className="flex flex-wrap items-center gap-4 px-5 py-4">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-placement" className="text-sm font-medium text-foreground whitespace-nowrap">
              Placement
            </label>
            <select
              id="filter-placement"
              value={filterPlacement}
              onChange={(e) => setFilterPlacement(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground min-w-[180px]"
            >
              {PLACEMENT_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-format" className="text-sm font-medium text-foreground whitespace-nowrap">
              Type
            </label>
            <select
              id="filter-format"
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground min-w-[140px]"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {(filterPlacement || filterFormat) && (
            <button
              type="button"
              onClick={() => { setFilterPlacement(''); setFilterFormat('') }}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Clear filters
            </button>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredAds.length} of {ads.length} ad{ads.length !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>

      {/* Placement reference */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(PLACEMENT_LABELS).filter(([k]) => !['INLINE', 'COMMENTS'].includes(k)).map(([key, { label, icon }]) => (
          <div key={key} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{icon}</span>
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(FORMAT_LABELS)
                .filter(([f]) => {
                  const allowed: Record<string, string[]> = {
                    FEED: ['BANNER', 'PUZZLE', 'SURVEY'],
                    STORE: ['VIDEO', 'PUZZLE', 'SURVEY', 'BANNER'],
                    NOTIFICATIONS: ['BANNER'],
                    CHAT: ['VIDEO', 'PUZZLE', 'SURVEY', 'BANNER'],
                  }
                  return allowed[key]?.includes(f)
                })
                .map(([f, { label: fl, color }]) => (
                  <span key={f} className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${color}`}>
                    {fl}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <Card className="admin-card overflow-hidden">
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading ads…
            </div>
          </div>
        </Card>
      ) : ads.length === 0 ? (
        <Card className="admin-card overflow-hidden border-border/60">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-muted/80 p-4 text-muted-foreground">
              <MegaphoneIcon className="size-8" />
            </div>
            <h2 className="mt-4 text-sm font-medium text-foreground">No ads yet</h2>
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              Create your first ad to show it in the feed, store, notifications, or chat.
            </p>
            <Button asChild className="mt-4">
              <Link href="/ads/new">Create ad</Link>
            </Button>
          </div>
        </Card>
      ) : filteredAds.length === 0 ? (
        <Card className="admin-card overflow-hidden border-border/60">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <p className="text-sm font-medium text-foreground">No ads match the current filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Try changing placement or type above.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setFilterPlacement(''); setFilterFormat('') }}>
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="admin-card overflow-hidden">
          <CardHeader className="border-b border-border/50 px-5 py-4">
            <CardTitle className="text-base font-semibold">Ads</CardTitle>
            <p className="text-sm text-muted-foreground">{filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''}{filterPlacement || filterFormat ? ` (filtered)` : ''}</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Title</TableHead>
                  <TableHead className="font-medium">Placement</TableHead>
                  <TableHead className="font-medium">Format</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Updated</TableHead>
                  <TableHead className="font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((ad) => {
                  const placement = PLACEMENT_LABELS[ad.placement] ?? { label: ad.placement, icon: '' }
                  const format = FORMAT_LABELS[ad.format ?? 'BANNER'] ?? { label: ad.format, color: STATUS_STYLES.DRAFT }
                  return (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{ad.title}</div>
                        {ad.body && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{ad.body}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-foreground">
                          <span>{placement.icon}</span>
                          <span>{placement.label}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${format.color}`}>
                          {format.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[ad.status] ?? STATUS_STYLES.DRAFT}`}>
                          {ad.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {new Date(ad.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/ads/${ad.id}/edit`}>Edit</Link>
                          </Button>
                          {ad.status === 'DRAFT' ? (
                            <Button size="sm" disabled={actioning === ad.id} onClick={() => handlePublish(ad)}>
                              {actioning === ad.id ? '…' : 'Publish'}
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" disabled={actioning === ad.id} onClick={() => handleUnpublish(ad)}>
                              {actioning === ad.id ? '…' : 'Unpublish'}
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={actioning === ad.id}
                            onClick={() => handleDelete(ad)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.2-3" />
    </svg>
  )
}
