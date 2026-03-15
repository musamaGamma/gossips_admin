'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminErrorsApi, ErrorLog } from '../lib/api'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
  POST: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
  PUT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  PATCH: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function CrashReportsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const limit = 50

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminErrorsApi.list({ page: p, limit })
      setLogs(data.logs)
      setTotal(data.total)
    } catch (e: any) {
      setError(e?.message || 'Failed to load crash reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  async function handleDelete(id: string) {
    await adminErrorsApi.delete(id)
    setLogs(prev => prev.filter(l => l.id !== id))
    setTotal(prev => prev - 1)
  }

  async function handleClearAll() {
    if (!confirm(`Delete all ${total} crash logs? This cannot be undone.`)) return
    setClearing(true)
    try {
      await adminErrorsApi.clearAll()
      setLogs([])
      setTotal(0)
      setPage(1)
    } catch (e: any) {
      alert(e?.message || 'Failed to clear logs')
    } finally {
      setClearing(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crash Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unhandled 500 errors from the API server
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/30">
            {total} total
          </span>
          {total > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
              disabled={clearing}
            >
              {clearing ? 'Clearing…' : 'Clear all'}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading…
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card/40 py-20 gap-3">
          <svg className="size-10 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <p className="text-sm font-medium text-muted-foreground">No crash reports — all good!</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="w-[200px]">Message</TableHead>
                <TableHead className="w-[120px]">User</TableHead>
                <TableHead className="w-[90px]">When</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(log => (
                <>
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <TableCell>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${METHOD_STYLES[log.method] ?? 'bg-muted text-muted-foreground border border-border'}`}>
                        {log.method}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[240px] truncate" title={log.path}>
                      {log.path}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={log.message}>
                      {log.message}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.username ?? log.userId?.slice(0, 8) ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={e => { e.stopPropagation(); handleDelete(log.id) }}
                        title="Delete this log"
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expanded === log.id && (
                    <TableRow key={`${log.id}-stack`} className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={6} className="p-0">
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground font-medium">Status:</span>{' '}
                              <span className="font-mono">{log.statusCode}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground font-medium">Time:</span>{' '}
                              <span>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            {log.userId && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground font-medium">User:</span>{' '}
                                <span className="font-mono">{log.username} ({log.userId})</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Message</p>
                            <p className="text-sm font-medium text-foreground">{log.message}</p>
                          </div>
                          {log.stack && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Stack trace</p>
                              <pre className="rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                                {log.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}
