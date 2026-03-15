'use client'

import { useEffect, useState } from 'react'
import { adminReportsApi } from '../lib/api'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

type Report = {
  id: string
  reporterId: string
  targetType: string
  targetId: string
  reason: string
  status: string
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
  RESOLVED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
  DISMISSED: 'bg-muted text-muted-foreground border border-border',
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DISMISSED
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide ${style}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminReportsApi
      .list({ limit: 50 })
      .then((res) => setReports(res.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="relative space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Reports</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Review and manage user-submitted reports
        </p>
      </div>
      {loading ? (
        <div className="admin-card overflow-hidden">
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading reports…
            </div>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="admin-card overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-muted/80 p-4 text-muted-foreground">
              <InboxIcon className="size-8" />
            </div>
            <h2 className="mt-4 text-sm font-medium text-foreground">No reports yet</h2>
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              When users report content, it will appear here for review.
            </p>
          </div>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="border-b border-border/50 px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Recent reports</h2>
            <p className="text-sm text-muted-foreground">
              {reports.length} report{reports.length !== 1 ? 's' : ''} loaded
            </p>
          </div>
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Target</TableHead>
                  <TableHead className="font-medium">Reason</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} className="transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{r.targetType}</div>
                      <div className="mt-0.5 max-w-[220px] truncate font-mono text-xs text-muted-foreground">
                        {r.targetId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-foreground" title={r.reason}>
                        {r.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

