/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

// Bump this to force a full cache invalidation on all clients
const SW_VERSION = '1.5.0'
console.log('[SW] version', SW_VERSION)

// Clean up old caches, then precache all assets injected by vite-plugin-pwa
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Navigation fallback (SPA): serve index.html for non-API routes
registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: 'navigation', networkTimeoutSeconds: 3 }),
    { denylist: [/^\/api\//, /^\/uploads\//] }
  )
)

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images' })
)

// ─── Push notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() as {
    title?: string
    body?: string
    icon?: string
    url?: string
  } ?? {}

  const title = data.title ?? 'AlmeidaPlanner'
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: data.icon ?? '/pwa-icon.svg',
    badge: '/pwa-icon.svg',
    data: { url: data.url ?? '/' },
    requireInteraction: false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const urlToOpen = (event.notification.data?.url as string) ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find(
          (c) => c.url.startsWith(self.location.origin)
        )
        if (existing) return existing.focus()
        return self.clients.openWindow(urlToOpen)
      })
  )
})
