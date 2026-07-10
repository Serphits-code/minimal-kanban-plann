import { apiClient } from './api'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

/** Register the service worker. Returns the existing or new registration. */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SW_URL)
  } catch (err) {
    console.error('[SW] Registration failed:', err)
    return null
  }
}

/** Ask for permission and subscribe to push. Sends subscription to backend. */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    // 2. Get VAPID public key from backend (public endpoint, no auth)
    const vapidRes = await fetch(`${API_BASE_URL}/push/vapid-key`)
    const { publicKey } = await vapidRes.json()
    if (!publicKey) return false

    // 3. Get or register service worker
    const reg = await navigator.serviceWorker.ready

    // 4. Subscribe
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    // 5. Send to backend
    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }
    await apiClient.request('/push/subscribe', {
      method: 'POST',
      body: { endpoint, keys },
    })
    return true
  } catch (err) {
    console.error('[Push] subscribeToPush error:', err)
    return false
  }
}

/** Remove push subscription both locally and from backend. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return

    const { endpoint } = sub.toJSON() as { endpoint: string }
    await sub.unsubscribe()
    await apiClient.request('/push/unsubscribe', {
      method: 'DELETE',
      body: { endpoint },
    }).catch(() => {})
  } catch (err) {
    console.error('[Push] unsubscribeFromPush error:', err)
  }
}

/** True if we already have an active push subscription registered. */
export async function hasActivePushSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub !== null
  } catch {
    return false
  }
}
