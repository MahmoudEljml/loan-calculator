import './PWABadge.css'

import { useRegisterSW } from 'virtual:pwa-register/react'

function PWABadge() {
  // Check for updates every 60 seconds (you can change this number)
  const period = 60 * 1000

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check that registration exists
      if (!registration) return

      // Check for updates periodically
      registerPeriodicSync(period, swUrl, registration)

      // Check for updates on page load
      if (registration.active?.state === 'activated') {
        registration.update()
      }
    },
    onNeedRefresh() {
      setNeedRefresh(true)
    },
    onOfflineReady() {
      setOfflineReady(true)
    },
  })

  function close() {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  return (
    <div className="PWABadge" role="alert" aria-labelledby="toast-message">
      {(offlineReady)
        && (
          <div className="PWABadge-toast">
            <div className="PWABadge-message">
              <span id="toast-message">App ready to work offline.</span>
            </div>
            <div className="PWABadge-buttons">
              <button className="PWABadge-toast-button" onClick={() => close()}>Close</button>
            </div>
          </div>
        )}
      {(needRefresh)
        && (
          <div className="PWABadge-toast">
            <div className="PWABadge-message">
              <span id="toast-message">💾 New content available! Click on reload button to update.</span>
            </div>
            <div className="PWABadge-buttons">
              <button className="PWABadge-toast-button" onClick={() => updateServiceWorker(true)}>Reload</button>
              <button className="PWABadge-toast-button" onClick={() => close()}>Close</button>
            </div>
          </div>
        )}
    </div>
  )
}

export default PWABadge

/**
 * This function will check for updates periodically (every minute by default)
 * You can change the time period as needed
 */
function registerPeriodicSync(period: number, swUrl: string, registration: ServiceWorkerRegistration) {
  if (period <= 0) return

  // Instant check on registration
  registration.update().catch(() => {
    // ignore errors
  })

  // Then periodic check
  setInterval(async () => {
    if ('onLine' in navigator && !navigator.onLine)
      return

    try {
      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          'cache-control': 'no-cache, no-store, must-revalidate',
          'pragma': 'no-cache',
          'expires': '0',
        },
      })

      if (resp?.status === 200)
        await registration.update()
    } catch (e) {
      console.error(e);
    }
  }, period)
}
