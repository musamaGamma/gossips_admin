'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminAdsApi } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { AdForm, type AdFormValues } from '../../components/ad-form'

export default function NewAdPage() {
  const router = useRouter()

  const handleSubmit = async (values: AdFormValues) => {
    await adminAdsApi.create({
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

  return (
    <div className="relative space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ads">← Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Create ad</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add a new ad to the app</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <AdForm mode="create" onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
