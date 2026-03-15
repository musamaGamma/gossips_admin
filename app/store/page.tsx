'use client'

import { useEffect, useState } from 'react'
import { adminStoreApi } from '../lib/api'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type StoreItemRow = {
  id: string
  slug: string
  name: string
  description: string
  cost: number
  isActive: boolean
  category: string
  isSubscription: boolean
  subscriptionPeriod: string | null
  subscriptionCost: number | null
}

const SUBSCRIPTION_PERIODS = [
  { value: 'DAY', label: 'Day' },
  { value: 'WEEK', label: 'Week' },
  { value: 'MONTH', label: 'Month' },
  { value: 'YEAR', label: 'Year' },
] as const

export default function StorePage() {
  const [items, setItems] = useState<StoreItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCost, setEditingCost] = useState<Record<string, number>>({})
  const [editingSubscription, setEditingSubscription] = useState<
    Record<string, { isSubscription: boolean; subscriptionPeriod: string; subscriptionCost: number }>
  >({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [billingRunning, setBillingRunning] = useState(false)
  const [billingResult, setBillingResult] = useState<{ charged: number; lapsed: number } | null>(null)

  useEffect(() => {
    adminStoreApi
      .listItems()
      .then((res) =>
        setItems(
          (res.items ?? []).map((i: any) => ({
            ...i,
            isSubscription: i.isSubscription ?? false,
            subscriptionPeriod: i.subscriptionPeriod ?? null,
            subscriptionCost: i.subscriptionCost ?? null,
          }))
        )
      )
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCostChange = (id: string, cost: number) => {
    setEditingCost((prev) => ({ ...prev, [id]: cost }))
  }

  const handleSaveCost = async (idOrSlug: string, cost: number) => {
    setSaving(idOrSlug)
    setError(null)
    try {
      const res = await adminStoreApi.updateItem(idOrSlug, { cost })
      setItems((prev) =>
        prev.map((i) => (i.id === res.item.id || i.slug === res.item.slug ? { ...i, cost: res.item.cost } : i))
      )
      setEditingCost((prev) => {
        const next = { ...prev }
        delete next[idOrSlug]
        const bySlug = items.find((x) => x.slug === idOrSlug)
        if (bySlug) delete next[bySlug.id]
        return next
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveSubscription = async (
    idOrSlug: string,
    payload: { isSubscription: boolean; subscriptionPeriod: string; subscriptionCost: number }
  ) => {
    setSaving(idOrSlug)
    setError(null)
    try {
      const res = await adminStoreApi.updateItem(idOrSlug, {
        isSubscription: payload.isSubscription,
        subscriptionPeriod: payload.isSubscription ? (payload.subscriptionPeriod as 'DAY' | 'WEEK' | 'MONTH' | 'YEAR') : undefined,
        subscriptionCost: payload.isSubscription ? payload.subscriptionCost : undefined,
      })
      setItems((prev) =>
        prev.map((i) =>
          i.id === res.item.id || i.slug === res.item.slug
            ? {
                ...i,
                isSubscription: res.item.isSubscription ?? false,
                subscriptionPeriod: res.item.subscriptionPeriod ?? null,
                subscriptionCost: res.item.subscriptionCost ?? null,
              }
            : i
        )
      )
      setEditingSubscription((prev) => {
        const next = { ...prev }
        const bySlug = items.find((x) => x.slug === idOrSlug)
        if (bySlug) delete next[bySlug.id]
        delete next[idOrSlug]
        return next
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update subscription')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="relative space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Store items</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Edit item costs. Changes apply immediately for new purchases.
        </p>
      </div>
      <Card className="admin-card">
        <CardHeader className="border-b border-border/50 px-5 py-4">
          <CardTitle className="text-base font-semibold">Subscription billing</CardTitle>
          <p className="text-sm text-muted-foreground">
            Run the subscription billing job to charge users with due recurring subscriptions. Run this on a schedule (e.g. daily) or manually.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-5">
          <Button
            onClick={async () => {
              setBillingRunning(true)
              setBillingResult(null)
              setError(null)
              try {
                const res = await adminStoreApi.runSubscriptionBilling()
                setBillingResult(res)
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Billing run failed')
              } finally {
                setBillingRunning(false)
              }
            }}
            disabled={billingRunning}
          >
            {billingRunning ? 'Running…' : 'Run subscription billing now'}
          </Button>
          {billingResult && (
            <p className="text-sm text-muted-foreground">
              Charged: {billingResult.charged}, lapsed: {billingResult.lapsed}
            </p>
          )}
        </CardContent>
      </Card>
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading ? (
        <Card className="admin-card overflow-hidden">
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading items…
            </div>
          </div>
        </Card>
      ) : (
        <Card className="admin-card overflow-hidden">
          <CardHeader className="border-b border-border/50 px-5 py-4">
            <CardTitle className="text-base font-semibold">All items</CardTitle>
            <p className="text-sm text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Slug</TableHead>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Cost (pts)</TableHead>
                  <TableHead className="font-medium">Subscription</TableHead>
                  <TableHead className="font-medium">Period</TableHead>
                  <TableHead className="font-medium">Recurring (pts)</TableHead>
                  <TableHead className="font-medium">Active</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const costValue = editingCost[item.id] ?? editingCost[item.slug] ?? item.cost
                  const isDirty =
                    (editingCost[item.id] !== undefined || editingCost[item.slug] !== undefined) &&
                    costValue !== item.cost
                  const subEdit = editingSubscription[item.id] ?? editingSubscription[item.slug] ?? {
                    isSubscription: item.isSubscription,
                    subscriptionPeriod: item.subscriptionPeriod ?? 'MONTH',
                    subscriptionCost: item.subscriptionCost ?? 0,
                  }
                  const subDirty =
                    subEdit.isSubscription !== item.isSubscription ||
                    (item.isSubscription && (subEdit.subscriptionPeriod !== (item.subscriptionPeriod ?? '') || subEdit.subscriptionCost !== (item.subscriptionCost ?? 0)))
                  return (
                    <TableRow key={item.id} className="transition-colors">
                      <TableCell className="font-mono text-sm text-muted-foreground">{item.slug}</TableCell>
                      <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={costValue}
                            onChange={(e) =>
                              handleCostChange(item.id, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-24 h-8 text-sm"
                          />
                          {isDirty && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8"
                              disabled={saving !== null}
                              onClick={() => handleSaveCost(item.slug, costValue)}
                            >
                              {saving === item.slug || saving === item.id ? 'Saving…' : 'Save'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={subEdit.isSubscription}
                            onChange={(e) =>
                              setEditingSubscription((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...subEdit,
                                  isSubscription: e.target.checked,
                                },
                              }))
                            }
                            className="rounded border-border"
                          />
                          <span className="text-sm">Recurring</span>
                        </label>
                      </TableCell>
                      <TableCell>
                        {subEdit.isSubscription ? (
                          <select
                            value={subEdit.subscriptionPeriod}
                            onChange={(e) =>
                              setEditingSubscription((prev) => ({
                                ...prev,
                                [item.id]: { ...subEdit, subscriptionPeriod: e.target.value },
                              }))
                            }
                            className="h-8 rounded border border-border bg-background px-2 text-sm"
                          >
                            {SUBSCRIPTION_PERIODS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subEdit.isSubscription ? (
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={subEdit.subscriptionCost}
                            onChange={(e) =>
                              setEditingSubscription((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...subEdit,
                                  subscriptionCost: parseInt(e.target.value, 10) || 0,
                                },
                              }))
                            }
                            className="w-20 h-8 text-sm"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            item.isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          }
                        >
                          {item.isActive ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {subDirty && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8"
                            disabled={saving !== null}
                            onClick={() =>
                              handleSaveSubscription(item.slug, {
                                isSubscription: subEdit.isSubscription,
                                subscriptionPeriod: subEdit.subscriptionPeriod,
                                subscriptionCost: subEdit.subscriptionCost,
                              })
                            }
                          >
                            {saving === item.slug || saving === item.id ? 'Saving…' : 'Save sub'}
                          </Button>
                        )}
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
