import { useEffect, useState } from 'react'
import { pendingClockings } from './api.js'

// Numero di timbrature salvate sul dispositivo e in attesa di invio.
// Si aggiorna subito all'evento emesso dal buffer e, per sicurezza, anche al
// ritorno della connessione, al focus della finestra e con un polling leggero.
// In modalità demo vale sempre 0 (il buffer non è attivo).
export function usePendingClockings() {
  const [count, setCount] = useState(() => pendingClockings())

  useEffect(() => {
    const update = () => setCount(pendingClockings())
    update()
    window.addEventListener('clock-pending-changed', update)
    window.addEventListener('online', update)
    window.addEventListener('focus', update)
    const id = setInterval(update, 5000)
    return () => {
      window.removeEventListener('clock-pending-changed', update)
      window.removeEventListener('online', update)
      window.removeEventListener('focus', update)
      clearInterval(id)
    }
  }, [])

  return count
}
