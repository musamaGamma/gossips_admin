'use client'

import './globals.css'
import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAccessToken } from './lib/auth'
import { adminAuthApi } from './lib/api'
import { AdminSidebar } from './components/sidebar'

export default function RootLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function check() {
      const token = getAccessToken()
      if (!token) {
        if (pathname !== '/login') router.replace('/login')
        setChecked(true)
        return
      }
      try {
        const { user } = await adminAuthApi.me()
        if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
          router.replace('/login')
        }
      } catch {
        router.replace('/login')
      } finally {
        setChecked(true)
      }
    }
    if (pathname !== '/login') {
      check()
    } else {
      setChecked(true)
    }
  }, [pathname, router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const isLogin = pathname === '/login'

  return (
    <html lang="en" data-theme="red" className="dark">
      <body className="min-h-dvh bg-background text-foreground">
        {!checked ? (
          <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
            Checking admin access...
          </div>
        ) : isLogin ? (
          children
        ) : (
          <div className="flex min-h-dvh">
            {/* Mobile overlay when sidebar open */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden
              />
            )}
            <div
              className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200 ease-out lg:relative lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </div>
            <div className="flex min-h-dvh flex-1 flex-col min-w-0">
              <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex lg:hidden size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50"
                  aria-label="Open menu"
                >
                  <MenuIcon className="size-5" />
                </button>
                <div className="flex-1 min-w-0 text-sm text-muted-foreground truncate">
                  Moderation &amp; Analytics
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </header>
              <main className="admin-main flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
            </div>
          </div>
        )}
      </body>
    </html>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

