'use client'

import { useEffect, useState } from 'react'
import { adminUsersApi, type AdminUser } from '../lib/api'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    adminUsersApi
      .list({ page, limit, search: search || undefined })
      .then((res) => {
        setUsers(res.users ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setUsers([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Delete user @${user.username}? This cannot be undone.`)) return
    setDeletingId(user.id)
    try {
      await adminUsersApi.delete(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setTotal((t) => Math.max(0, t - 1))
    } catch (err: unknown) {
      const msg = (err as { body?: { error?: string }; message?: string })?.body?.error ?? (err as Error).message
      alert(msg || 'Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="relative space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Users</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          View and manage users. Deleting a user removes their account and related data.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 sm:gap-3">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput('')
              setSearch('')
              setPage(1)
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <div className="admin-card overflow-hidden">
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading users…
            </div>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-card overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-muted/80 p-4 text-muted-foreground">
              <UsersIcon className="size-8" />
            </div>
            <h2 className="mt-4 text-sm font-medium text-foreground">No users found</h2>
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              {search ? 'Try a different search.' : 'No users in the system yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="border-b border-border/50 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-base font-semibold text-foreground">User list</h2>
            <p className="text-sm text-muted-foreground">
              {total} user{total !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">User</TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">Role</TableHead>
                  <TableHead className="font-medium">Points</TableHead>
                  <TableHead className="font-medium">Created</TableHead>
                  <TableHead className="font-medium w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl.startsWith('http') ? u.photoUrl : `${API_BASE}${u.photoUrl}`}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-foreground">@{u.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      {u.email || '—'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-foreground">{u.points}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id}
                        >
                          {deletingId === u.id ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <TrashIcon className="size-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-4 py-3 sm:px-5">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}
