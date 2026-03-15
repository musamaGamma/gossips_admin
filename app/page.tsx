'use client'

import React from 'react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { adminMetricsApi } from './lib/api'
import { Button } from '@/components/ui/button'

const METRICS: Array<{ key: 'totalUsers' | 'totalThreads' | 'totalComments' | 'openReports'; label: string; icon: (p: { className?: string }) => React.ReactNode; highlight?: boolean }> = [
  { key: 'totalUsers', label: 'Total users', icon: UsersIcon },
  { key: 'totalThreads', label: 'Threads', icon: FileTextIcon },
  { key: 'totalComments', label: 'Comments', icon: MessageCircleIcon },
  { key: 'openReports', label: 'Open reports', icon: FlagIcon, highlight: true },
]

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<{
    totalUsers: number
    totalThreads: number
    totalComments: number
    openReports: number
  } | null>(null)

  useEffect(() => {
    adminMetricsApi
      .summary()
      .then(setMetrics)
      .catch(() => setMetrics(null))
  }, [])

  return (
    <div className="relative space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Overview</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Platform metrics at a glance
        </p>
      </div>
      {!metrics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="admin-metric-card overflow-hidden">
              <div className="h-24 animate-pulse rounded-t-[var(--radius)] bg-muted/30" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map(({ key, label, icon: Icon, highlight }) => (
            <MetricCard
              key={key}
              label={label}
              value={metrics[key]}
              icon={<Icon className="size-5" />}
              highlight={highlight}
              href={key === 'openReports' && metrics.openReports > 0 ? '/reports' : undefined}
            />
          ))}
        </div>
      )}
      {metrics && metrics.openReports > 0 && (
        <div className="admin-card overflow-hidden border-primary/20 bg-primary/5">
          <div className="flex flex-row flex-wrap items-center justify-between gap-4 px-5 py-4">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{metrics.openReports}</span> open report{metrics.openReports !== 1 ? 's' : ''} need attention.
            </p>
            <Button asChild variant="default" size="sm" className="shrink-0">
              <Link href="/reports">View reports</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  highlight,
  href,
}: {
  label: string
  value: number
  icon: React.ReactNode
  highlight?: boolean
  href?: string
}) {
  const card = (
    <div className={`admin-metric-card overflow-hidden p-5 ${highlight ? 'ring-1 ring-primary/15' : ''}`}>
      <div className="flex flex-row items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`rounded-lg p-2 ${highlight ? 'bg-primary/12 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
          {icon}
        </div>
      </div>
      <div className="admin-metric-value mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {value.toLocaleString()}
      </div>
    </div>
  )
  if (href) {
    return <Link href={href} className="block transition-opacity hover:opacity-90">{card}</Link>
  }
  return card
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  )
}

