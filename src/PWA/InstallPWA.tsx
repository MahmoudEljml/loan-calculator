import { useEffect, useState } from 'react'
import './PWABadge.css'

function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    try {
      // `prompt` and `userChoice` exist on the saved event
      await (deferredPrompt as any).prompt()
      await (deferredPrompt as any).userChoice
    } catch (e) {
      // ignore
    }
    setVisible(false)
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="PWABadge PWABadge-install" role="dialog" aria-label="Install app">
      <div className="PWABadge-toast">
        <div className="PWABadge-message">
          <span>Install this app for quick access.</span>
        </div>
        <div className="PWABadge-buttons">
          <button className="PWABadge-toast-button" onClick={handleInstall}>Install</button>
          <button className="PWABadge-toast-button" onClick={() => setVisible(false)}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default InstallPWA
