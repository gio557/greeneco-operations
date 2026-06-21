import { useEffect, useRef, useState } from 'react'

// Estrae l'id del mezzo dal contenuto del QR: accetta sia un URL con
// ?vehicle=ID sia l'id grezzo.
export function parseVehicleCode(text) {
  if (!text) return null
  try {
    const url = new URL(text)
    const v = url.searchParams.get('vehicle')
    if (v) return v
  } catch {
    // non è un URL: prosegui
  }
  const m = String(text).match(/vehicle=([\w-]+)/)
  if (m) return m[1]
  if (/^[\w-]+$/.test(text.trim())) return text.trim()
  return null
}

export const qrScanSupported =
  typeof window !== 'undefined' && 'BarcodeDetector' in window

// Scanner QR in-app basato su BarcodeDetector (dove supportato). Chiama
// onDetected(id) al primo QR valido riconosciuto.
export default function QrScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream = null
    let raf = null
    let stopped = false
    let detector = null

    async function start() {
      if (!qrScanSupported) {
        setError('Scanner non supportato su questo dispositivo.')
        return
      }
      try {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (stopped) return
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        scan(video)
      } catch {
        setError('Impossibile accedere alla fotocamera. Concedi il permesso o usa la selezione manuale.')
      }
    }

    async function scan(video) {
      if (stopped) return
      try {
        const codes = await detector.detect(video)
        if (codes && codes.length > 0) {
          const id = parseVehicleCode(codes[0].rawValue)
          if (id) {
            stop()
            onDetected(id)
            return
          }
        }
      } catch {
        // frame non leggibile: riprova
      }
      raf = requestAnimationFrame(() => scan(video))
    }

    function stop() {
      stopped = true
      if (raf) cancelAnimationFrame(raf)
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }

    start()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="scanner">
      <div className="scanner-frame">
        <video ref={videoRef} className="scanner-video" playsInline muted />
        <div className="scanner-reticle" aria-hidden />
      </div>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <p className="muted center small">Inquadra il QR applicato sul mezzo…</p>
      )}
      <button className="btn-ghost btn-block" onClick={onClose}>Annulla</button>
    </div>
  )
}
