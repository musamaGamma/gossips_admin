const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

import { getAccessToken, setAccessToken, clearAccessToken } from './auth'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: { error?: string; code?: string }
  ) {
    super(body?.error || message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit & { skipAuth?: boolean } = {}): Promise<T> {
  const { skipAuth, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  }
  const token = getAccessToken()
  if (!skipAuth && token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data?.error || res.statusText, data)
  return data as T
}

export const adminAuthApi = {
  loginPassword: (username: string, password: string) =>
    request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login-password', {
      method: 'POST',
      body: JSON.stringify({ identifier: username, password }),
      skipAuth: true,
    }),
  me: () => request<{ user: any }>('/auth/me'),
}

export const adminReportsApi = {
  list: (params?: { status?: string; targetType?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.targetType) q.set('targetType', params.targetType)
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    const query = q.toString()
    return request<{ reports: any[]; total: number; page: number; limit: number }>(
      `/admin/reports${query ? `?${query}` : ''}`
    )
  },
}

export const adminStoreApi = {
  listItems: () => request<{ items: any[] }>('/admin/store/items'),
  runSubscriptionBilling: () =>
    request<{ charged: number; lapsed: number }>('/admin/store/run-subscription-billing', {
      method: 'POST',
    }),
  updateItem: (
    idOrSlug: string,
    data: {
      cost?: number
      isActive?: boolean
      description?: string
      isSubscription?: boolean
      subscriptionPeriod?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
      subscriptionCost?: number
    }
  ) =>
    request<{ item: any }>(`/admin/store/items/${encodeURIComponent(idOrSlug)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

export const adminPointsConfigApi = {
  get: () => request<{ config: Record<string, unknown> }>('/admin/points-config'),
  getDefaults: () => request<{ config: Record<string, unknown> }>('/admin/points-config/defaults'),
  update: (config: Record<string, unknown>) =>
    request<{ config: Record<string, unknown> }>('/admin/points-config', {
      method: 'PATCH',
      body: JSON.stringify(config),
    }),
}

export const adminMetricsApi = {
  summary: () => request<{ totalUsers: number; totalThreads: number; totalComments: number; openReports: number }>('/admin/metrics/summary'),
}

export type AdminUser = {
  id: string
  username: string
  email: string | null
  role: string
  points: number
  hasPhoto: boolean
  photoUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

export const adminUsersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.search) q.set('search', params.search)
    const query = q.toString()
    return request<{ users: AdminUser[]; total: number; page: number; limit: number }>(
      `/admin/users${query ? `?${query}` : ''}`
    )
  },
  delete: (id: string) =>
    request<{ success: boolean }>(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export type Ad = {
  id: string
  title: string
  body: string | null
  ctaText: string
  linkUrl: string | null
  imageUrl: string | null
  videoUrl: string | null
  format: 'BANNER' | 'PUZZLE' | 'VIDEO' | 'SURVEY'
  status: 'DRAFT' | 'PUBLISHED'
  placement: 'FEED' | 'INLINE' | 'COMMENTS' | 'NOTIFICATIONS' | 'STORE' | 'CHAT'
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
}

export const adminAdsApi = {
  list: () => request<{ ads: Ad[] }>('/admin/ads'),
  get: (id: string) => request<{ ad: Ad }>(`/admin/ads/${id}`),
  create: (data: Partial<Ad> & { title: string }) =>
    request<{ ad: Ad }>('/admin/ads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Ad>) =>
    request<{ ad: Ad }>(`/admin/ads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/admin/ads/${id}`, { method: 'DELETE' }),
  publish: (id: string) =>
    request<{ ad: Ad }>(`/admin/ads/${id}/publish`, { method: 'POST' }),
  unpublish: (id: string) =>
    request<{ ad: Ad }>(`/admin/ads/${id}/unpublish`, { method: 'POST' }),
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const token = getAccessToken()
    const formData = new FormData()
    formData.append('image', file)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/ads/upload`, {
      method: 'POST',
      body: formData,
      headers,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new ApiError(res.status, data?.error || res.statusText, data)
    return data as { url: string }
  },
  uploadVideo: async (file: File): Promise<{ url: string }> => {
    const token = getAccessToken()
    const formData = new FormData()
    formData.append('video', file)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/ads/upload-video`, {
      method: 'POST',
      body: formData,
      headers,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new ApiError(res.status, data?.error || res.statusText, data)
    return data as { url: string }
  },
}

export type ErrorLog = {
  id: string
  path: string
  method: string
  statusCode: number
  message: string
  stack: string | null
  userId: string | null
  username: string | null
  createdAt: string
}

export const adminErrorsApi = {
  list: (params?: { page?: number; limit?: number; path?: string; statusCode?: number }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.path) q.set('path', params.path)
    if (params?.statusCode) q.set('statusCode', String(params.statusCode))
    const query = q.toString()
    return request<{ logs: ErrorLog[]; total: number; page: number; limit: number }>(
      `/admin/errors${query ? `?${query}` : ''}`
    )
  },
  delete: (id: string) => request<{ success: boolean }>(`/admin/errors/${id}`, { method: 'DELETE' }),
  clearAll: () => request<{ success: boolean; deleted: number }>('/admin/errors', { method: 'DELETE' }),
}

export const adminNotificationsApi = {
  send: (body: { message: string; all?: boolean; usernames?: string[] }) =>
    request<{ sent: number; total: number; results: { userId: string; notificationId?: string; error?: boolean }[] }>(
      '/admin/notifications/send',
      { method: 'POST', body: JSON.stringify(body) }
    ),
}

export type EidEventConfig = {
  isActive: boolean
  startAt: string | null
  endAt: string | null
  isWithinWindow: boolean
}

export const adminEidOutfitApi = {
  getEvent: () => request<EidEventConfig>('/admin/eid-outfit/event'),
  updateEvent: (data: { isActive?: boolean; startAt?: string; endAt?: string }) =>
    request<{ id: string; isActive: boolean; startAt: string; endAt: string }>('/admin/eid-outfit/event', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listPending: () =>
    request<{ list: { id: string; userId: string; username: string; caption: string | null; createdAt: string }[] }>(
      '/admin/eid-outfit/pending'
    ),
  listLive: () =>
    request<{ list: { id: string; userId: string; username: string; caption: string | null; createdAt: string; viewCount: number }[] }>(
      '/admin/eid-outfit/live'
    ),
  getImageUrl: (id: string) => `${API_BASE}/admin/eid-outfit/${encodeURIComponent(id)}/image`,
  approve: (id: string) => request<{ success: boolean }>(`/admin/eid-outfit/${id}/approve`, { method: 'POST' }),
  reject: (id: string) => request<{ success: boolean }>(`/admin/eid-outfit/${id}/reject`, { method: 'POST' }),
  delete: (id: string) => request<{ success: boolean }>(`/admin/eid-outfit/${id}`, { method: 'DELETE' }),
  fetchImageBlob: async (id: string): Promise<Blob> => {
    const token = getAccessToken()
    const res = await fetch(`${API_BASE}/admin/eid-outfit/${encodeURIComponent(id)}/image`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new ApiError(res.status, data?.error || res.statusText, data)
    }
    return res.blob()
  },
}

export function handleLoginTokens(accessToken: string) {
  setAccessToken(accessToken)
}

