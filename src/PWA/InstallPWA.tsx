import { useEffect, useState } from 'react'
import './PWABadge.css'

/** Chromium: fired before the browser shows the PWA install prompt */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
    } catch {
      // ignore
    }
    setVisible(false)
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="PWABadge PWABadge-install" role="dialog" aria-label="تثبيت التطبيق">
      <div className="PWABadge-toast">
        <div className="PWABadge-message">
          <span dir='rtl'>ثبّت التطبيق للوصول السريع من الشاشة الرئيسية.</span>
        </div>
        <div className="PWABadge-buttons">
          <button type="button" className="PWABadge-toast-button" onClick={handleInstall}>
            تثبيت
          </button>
          <button type="button" className="PWABadge-toast-button" onClick={() => setVisible(false)}>
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPWA
