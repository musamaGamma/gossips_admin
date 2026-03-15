'use client'

import { useEffect, useState, useRef } from 'react'
import { adminEidOutfitApi, type EidEventConfig } from '../lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function toLocalDateTime(d: Date | string | null): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

export default function EidOutfitAdminPage() {
  const [event, setEvent] = useState<EidEventConfig | null>(null)
  const [pending, setPending] = useState<
    { id: string; userId: string; username: string; caption: string | null; createdAt: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const load = () => {
    Promise.all([
      adminEidOutfitApi.getEvent(),
      adminEidOutfitApi.listPending(),
    ])
      .then(([ev, pend]) => {
        setEvent(ev)
        if (ev) {
          setIsActive(ev.isActive)
          setStartAt(ev.startAt ? toLocalDateTime(ev.startAt) : '')
          setEndAt(ev.endAt ? toLocalDateTime(ev.endAt) : '')
        }
        setPending(pend.list ?? [])
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const viewBlobUrlRef = useRef<string | null>(null)
  useEffect(() => {
    if (!viewingId) {
      setViewBlobUrl(null)
      setViewError(null)
      setViewLoading(false)
      return
    }
    setViewError(null)
    setViewLoading(true)
    setViewBlobUrl(null)
    adminEidOutfitApi
      .fetchImageBlob(viewingId)
      .then((blob) => {
        if (viewBlobUrlRef.current) URL.revokeObjectURL(viewBlobUrlRef.current)
        viewBlobUrlRef.current = URL.createObjectURL(blob)
        setViewBlobUrl(viewBlobUrlRef.current)
        setViewError(null)
      })
      .catch((err) => {
        setViewError(err instanceof Error ? err.message : 'Failed to load image')
        setViewBlobUrl(null)
      })
      .finally(() => setViewLoading(false))
    return () => {
      if (viewBlobUrlRef.current) {
        URL.revokeObjectURL(viewBlobUrlRef.current)
        viewBlobUrlRef.current = null
      }
    }
  }, [viewingId])

  const handleSaveEvent = async () => {
    setSaving(true)
    setError(null)
    try {
      await adminEidOutfitApi.updateEvent({
        isActive,
        startAt: startAt || undefined,
        endAt: endAt || undefined,
      })
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id: string) => {
    setActioningId(id)
    try {
      await adminEidOutfitApi.approve(id)
      setPending((prev) => prev.filter((p) => p.id !== id))
      if (viewingId === id) setViewingId(null)
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (id: string) => {
    setActioningId(id)
    try {
      await adminEidOutfitApi.reject(id)
      setPending((prev) => prev.filter((p) => p.id !== id))
      if (viewingId === id) setViewingId(null)
    } finally {
      setActioningId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Eid event (كشخة العيد)</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Activate the event and set the time window (e.g. 3 days for Eid). Photos only show during this period. All uploads require manual approval before they appear.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event config</CardTitle>
          <p className="text-sm text-muted-foreground">
            When active and within the date range, users can upload and view approved outfits.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm font-medium">Event active</span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Start (local)</label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End (local)</label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          {event?.isWithinWindow && (
            <p className="text-xs text-emerald-600">Event is currently within window and active for users.</p>
          )}
          <Button onClick={handleSaveEvent} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending outfits (manual moderation)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and approve or reject uploads. Rejected photos are deleted. Only approved outfits appear in the app during the event.
          </p>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending outfits.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col rounded-lg border border-border bg-card p-3 gap-3"
                >
                  <p className="text-sm text-foreground line-clamp-2 min-h-[2.5rem]" title={p.caption ?? undefined}>
                    {p.caption || <span className="text-muted-foreground italic">No caption</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0 sm:flex-initial"
                      onClick={() => setViewingId((id) => (id === p.id ? null : p.id))}
                    >
                      {viewingId === p.id ? 'Hide' : 'View'}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 min-w-0 sm:flex-initial"
                      onClick={() => handleApprove(p.id)}
                      disabled={actioningId !== null}
                    >
                      {actioningId === p.id ? '…' : 'Approve'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 min-w-0 sm:flex-initial"
                      onClick={() => handleReject(p.id)}
                      disabled={actioningId !== null}
                    >
                      {actioningId === p.id ? '…' : 'Reject'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {viewingId && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 gap-4"
          onClick={() => setViewingId(null)}
        >
          {viewLoading && (
            <p className="text-white/90">Loading image…</p>
          )}
          {viewError && (
            <p className="text-red-300 text-center max-w-md">{viewError}</p>
          )}
          {viewBlobUrl && (
            <>
              <img
                src={viewBlobUrl}
                alt="Outfit"
                className="max-h-[70vh] max-w-full w-auto object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <p
                className="text-sm text-white/95 text-center max-w-md line-clamp-3"
                onClick={(e) => e.stopPropagation()}
              >
                {pending.find((p) => p.id === viewingId)?.caption || 'No caption'}
              </p>
            </>
          )}
          <button
            type="button"
            className="text-white/90 underline text-sm mt-2"
            onClick={(e) => { e.stopPropagation(); setViewingId(null); }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
