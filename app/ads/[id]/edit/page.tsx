'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { adminAdsApi, type Ad } from '../../../lib/api'
import { Button } from '@/components/ui/button'
import { AdForm, type AdFormValues } from '../../../components/ad-form'

export default function EditAdPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [ad, setAd] = useState<Ad | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!id) return
    adminAdsApi
      .get(id)
      .then((res) => setAd(res.ad))
      .catch(() => setAd(null))
      .finally(() => setFetching(false))
  }, [id])

  const handleSubmit = async (values: AdFormValues) => {
    await adminAdsApi.update(id, {
      title:     values.title.trim(),
      body:      values.body.trim()     || undefined,
      ctaText:   values.ctaText.trim()  || 'Learn more',
      linkUrl:   values.linkUrl.trim()  || undefined,
      imageUrl:  values.imageUrl.trim() || undefined,
      videoUrl:  values.videoUrl.trim() || undefined,
      format:    values.format,
      placement: values.placement,
    })
    router.replace('/ads')
  }

  if (fetching) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!ad) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Ad not found.</p>
        <Button asChild><Link href="/ads">Back to ads</Link></Button>
      </div>
    )
  }

  return (
    <div className="relative space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ads">← Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Edit ad</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update ad content and settings</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <AdForm
          mode="edit"
          status={ad.status}
          initial={{
            title:     ad.title,
            body:      ad.body      ?? '',
            ctaText:   ad.ctaText   ?? 'Learn more',
            linkUrl:   ad.linkUrl   ?? '',
            imageUrl:  ad.imageUrl  ?? '',
            videoUrl:  ad.videoUrl  ?? '',
            format:    (ad.format   ?? 'BANNER') as AdFormValues['format'],
            placement: (ad.placement)             as AdFormValues['placement'],
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
