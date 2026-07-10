import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, BellSimple, DeviceMobile } from '@phosphor-icons/react'
import { subscribeToPush, isPushSupported, getPermissionStatus, hasActivePushSubscription } from '@/lib/notifications'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const [notifRequesting, setNotifRequesting] = useState(false)

  // Capture the browser's install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      // Only show if user hasn't dismissed before
      if (!localStorage.getItem('pwa_install_dismissed')) {
        setShowInstallBanner(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // After SW is ready, check if we should prompt for notifications
  useEffect(() => {
    if (!isPushSupported()) return
    if (localStorage.getItem('notif_dismissed')) return

    const check = async () => {
      const permission = getPermissionStatus()
      if (permission === 'default') {
        // Only show if they don't already have a subscription
        const hasSub = await hasActivePushSubscription()
        if (!hasSub) setShowNotifBanner(true)
      } else if (permission === 'granted') {
        // Re-subscribe silently if no subscription saved (e.g. after clearing data)
        const hasSub = await hasActivePushSubscription()
        if (!hasSub) subscribeToPush().catch(() => {})
      }
    }

    // Delay slightly so SW has time to register
    const t = setTimeout(check, 3000)
    return () => clearTimeout(t)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_install_dismissed', '1')
    }
    setShowInstallBanner(false)
    setInstallPrompt(null)
  }

  const handleDismissInstall = () => {
    localStorage.setItem('pwa_install_dismissed', '1')
    setShowInstallBanner(false)
  }

  const handleEnableNotifications = async () => {
    setNotifRequesting(true)
    const ok = await subscribeToPush()
    setNotifRequesting(false)
    localStorage.setItem('notif_dismissed', '1')
    setShowNotifBanner(false)
    if (!ok && getPermissionStatus() === 'denied') {
      // permission blocked — nothing we can do, already dismissed
    }
  }

  const handleDismissNotif = () => {
    localStorage.setItem('notif_dismissed', '1')
    setShowNotifBanner(false)
  }

  if (!showInstallBanner && !showNotifBanner) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none">
      {/* Install banner */}
      {showInstallBanner && (
        <div className="pointer-events-auto bg-background border rounded-xl shadow-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <DeviceMobile size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Instalar AlmeidaPlanner</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione ao seu dispositivo para acesso rápido e offline.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall}>
                Instalar
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismissInstall}>
                Agora não
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-7 w-7"
            onClick={handleDismissInstall}
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Notification banner */}
      {showNotifBanner && (
        <div className="pointer-events-auto bg-background border rounded-xl shadow-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BellSimple size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Ativar notificações</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receba alertas quando for atribuído a uma tarefa e um resumo diário todo dia às 7h.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                disabled={notifRequesting}
              >
                {notifRequesting ? 'Ativando...' : 'Ativar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismissNotif}>
                Agora não
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-7 w-7"
            onClick={handleDismissNotif}
          >
            <X size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
