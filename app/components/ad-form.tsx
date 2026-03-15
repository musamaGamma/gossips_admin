'use client'

import { useState } from 'react'
import Link from 'next/link'
import { adminAdsApi, ApiError } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export type AdFormat = 'BANNER' | 'PUZZLE' | 'VIDEO' | 'SURVEY'
export type AdPlacement = 'FEED' | 'STORE' | 'NOTIFICATIONS' | 'CHAT'

export interface AdFormValues {
  title: string
  body: string
  ctaText: string
  linkUrl: string
  imageUrl: string
  videoUrl: string
  format: AdFormat
  placement: AdPlacement
}

/** Which formats each placement supports, in display order */
const PLACEMENT_FORMATS: Record<AdPlacement, AdFormat[]> = {
  FEED:          ['BANNER', 'PUZZLE', 'SURVEY'],
  STORE:         ['VIDEO',  'PUZZLE', 'SURVEY', 'BANNER'],
  NOTIFICATIONS: ['BANNER'],
  CHAT:          ['VIDEO',  'PUZZLE', 'SURVEY', 'BANNER'],
}

const PLACEMENT_META: Record<AdPlacement, { label: string; description: string; icon: string }> = {
  FEED: {
    label: 'Thread Feed',
    description: 'Shown between threads as users scroll the main feed.',
    icon: '📰',
  },
  STORE: {
    label: 'Store — Watch Ad',
    description: 'Shown in the "Watch ad for points" modal in the Store tab.',
    icon: '🏪',
  },
  NOTIFICATIONS: {
    label: 'Notifications',
    description: 'Shown between notification items in the Notifications tab.',
    icon: '🔔',
  },
  CHAT: {
    label: 'Chat — Waiting Screen',
    description: 'Shown while the user waits to be matched in Random Chat.',
    icon: '💬',
  },
}

const FORMAT_META: Record<AdFormat, { label: string; description: string; requiresImage?: boolean; requiresVideoUpload?: boolean }> = {
  BANNER: {
    label: 'Text / Image Banner',
    description: 'A card with headline, optional body text, and an optional image (upload).',
  },
  PUZZLE: {
    label: 'Puzzle Ad',
    description: 'User reassembles a shuffled image to reveal the brand. Upload an image.',
    requiresImage: true,
  },
  VIDEO: {
    label: 'Video Ad',
    description: 'A video the user watches. Upload an MP4 or WebM file (max 80MB).',
    requiresVideoUpload: true,
  },
  SURVEY: {
    label: 'Survey / Poll',
    description: 'A short poll or question card. Use the body field for the question and CTA for the submit label.',
  },
}

const DEFAULT_PLACEMENT: AdPlacement = 'FEED'

interface Props {
  mode: 'create' | 'edit'
  initial?: Partial<AdFormValues>
  status?: string
  onSubmit: (values: AdFormValues) => Promise<void>
}

export function AdForm({ mode, initial, status, onSubmit }: Props) {
  const [form, setForm] = useState<AdFormValues>({
    title:     initial?.title     ?? '',
    body:      initial?.body      ?? '',
    ctaText:   initial?.ctaText   ?? 'Learn more',
    linkUrl:   initial?.linkUrl   ?? '',
    imageUrl:  initial?.imageUrl  ?? '',
    videoUrl:  initial?.videoUrl ?? '',
    format:    initial?.format    ?? PLACEMENT_FORMATS[DEFAULT_PLACEMENT][0],
    placement: (initial?.placement as AdPlacement) ?? DEFAULT_PLACEMENT,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  const apiOrigin = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:4000'

  const allowedFormats = PLACEMENT_FORMATS[form.placement]

  const handlePlacementChange = (placement: AdPlacement) => {
    const formats = PLACEMENT_FORMATS[placement]
    setForm((f) => ({
      ...f,
      placement,
      format: formats.includes(f.format) ? f.format : formats[0],
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError(null)
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a JPEG, PNG, WebP or GIF image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError('Image must be under 2MB.')
      return
    }
    setImageUploading(true)
    try {
      const { url } = await adminAdsApi.uploadImage(file)
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setImageUploading(false)
      e.target.value = ''
    }
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoError(null)
    const valid = ['video/mp4', 'video/webm'].includes(file.type)
    if (!valid) {
      setVideoError('Please select an MP4 or WebM video.')
      return
    }
    if (file.size > 80 * 1024 * 1024) {
      setVideoError('Video must be under 80MB.')
      return
    }
    setVideoUploading(true)
    try {
      const { url } = await adminAdsApi.uploadVideo(file)
      setForm((f) => ({ ...f, videoUrl: url }))
    } catch (err) {
      setVideoError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setVideoUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.title.trim()) { setError('Title is required'); return }
    const fmeta = FORMAT_META[form.format]
    if (fmeta.requiresImage && !form.imageUrl) { setError('Please upload an image for Puzzle ads.'); return }
    if (fmeta.requiresVideoUpload && !form.videoUrl) { setError('Please upload a video for Video ads.'); return }

    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError(mode === 'create' ? 'Failed to create ad' : 'Failed to save ad')
    } finally {
      setLoading(false)
    }
  }

  const currentFmeta = FORMAT_META[form.format]
  const currentPmeta = PLACEMENT_META[form.placement]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Step 1: Placement ── */}
      <Card className="admin-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">1. Where will this ad appear?</CardTitle>
          <CardDescription className="text-xs">Choose the placement first — it determines which ad formats are available.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(PLACEMENT_META) as AdPlacement[]).map((p) => {
            const meta = PLACEMENT_META[p]
            const selected = form.placement === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePlacementChange(p)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <span className="text-xl leading-none mt-0.5">{meta.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>{meta.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{meta.description}</p>
                  <p className="mt-1.5 flex flex-wrap gap-1">
                    {PLACEMENT_FORMATS[p].map((f) => (
                      <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {FORMAT_META[f].label}
                      </span>
                    ))}
                  </p>
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* ── Step 2: Format ── */}
      <Card className="admin-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">2. Ad format</CardTitle>
          <CardDescription className="text-xs">
            <span className="font-medium text-foreground">{currentPmeta.label}</span> supports {allowedFormats.length} format{allowedFormats.length !== 1 ? 's' : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {allowedFormats.map((f) => {
            const meta = FORMAT_META[f]
            const selected = form.format === f
            return (
              <button
                key={f}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, format: f }))}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-primary' : 'border-muted-foreground'}`}>
                  {selected && <span className="block h-2 w-2 rounded-full bg-primary" />}
                </span>
                <div>
                  <p className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>{meta.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{meta.description}</p>
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* ── Step 3: Content ── */}
      <Card className="admin-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">3. Ad content</CardTitle>
          {status && (
            <CardDescription className="text-xs">Current status: <span className="font-medium">{status}</span></CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {form.format === 'SURVEY' ? 'Survey question *' : 'Headline *'}
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={form.format === 'SURVEY' ? 'e.g. How satisfied are you with remote work?' : 'e.g. Level up your career'}
              maxLength={120}
              className="max-w-lg"
            />
            <p className="text-xs text-muted-foreground">{form.title.length}/120</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {form.format === 'SURVEY' ? 'Answer options / description (optional)' : 'Body text (optional)'}
            </label>
            <Input
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder={form.format === 'SURVEY' ? 'e.g. Very satisfied · Satisfied · Neutral · Dissatisfied' : 'e.g. Premium job alerts from top companies'}
              maxLength={280}
              className="max-w-lg"
            />
            <p className="text-xs text-muted-foreground">{form.body.length}/280</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Button / CTA text</label>
            <Input
              value={form.ctaText}
              onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
              placeholder={form.format === 'SURVEY' ? 'Submit' : 'Learn more'}
              maxLength={40}
              className="max-w-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Button link (optional)</label>
            <p className="text-xs text-muted-foreground">Where the CTA button goes when tapped. Leave empty if no link.</p>
            <Input
              type="url"
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              placeholder="https://..."
              className="max-w-lg"
            />
          </div>

          {form.format === 'VIDEO' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Video *</label>
              <p className="text-xs text-muted-foreground">Upload MP4 or WebM, max 80MB.</p>
              <div className="flex flex-wrap items-start gap-3">
                <Input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleVideoChange}
                  disabled={videoUploading}
                  className="max-w-xs"
                />
                {form.videoUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Uploaded</span>
                    <video
                      src={form.videoUrl.startsWith('http') ? form.videoUrl : `${apiOrigin}${form.videoUrl}`}
                      controls
                      className="h-20 rounded border border-border object-cover"
                      preload="metadata"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, videoUrl: '' }))}
                      className="rounded bg-destructive px-2 py-1 text-[10px] font-medium text-destructive-foreground"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {videoUploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
              {videoError && <p className="text-xs text-destructive">{videoError}</p>}
            </div>
          )}

          {form.format !== 'VIDEO' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {currentFmeta.requiresImage ? 'Image *' : 'Image (optional)'}
              </label>
              <p className="text-xs text-muted-foreground">
                {currentFmeta.requiresImage
                  ? 'Required for Puzzle ads. JPEG, PNG, WebP or GIF, max 2MB.'
                  : 'JPEG, PNG, WebP or GIF, max 2MB.'}
              </p>
              <div className="flex flex-wrap items-start gap-3">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={imageUploading}
                  className="max-w-xs"
                />
                {form.imageUrl && (
                  <div className="relative">
                    <img
                      src={form.imageUrl.startsWith('http') ? form.imageUrl : `${apiOrigin}${form.imageUrl}`}
                      alt="Ad preview"
                      className="h-20 w-auto rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              {imageUploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
              {imageError && <p className="text-xs text-destructive">{imageError}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || imageUploading || videoUploading}>
          {loading ? (mode === 'create' ? 'Creating…' : 'Saving…') : (mode === 'create' ? 'Create ad' : 'Save changes')}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/ads">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
