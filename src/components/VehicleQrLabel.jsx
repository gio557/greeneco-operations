import qrcode from 'qrcode-generator'

// Costruisce il link che il QR codificherà: aprendolo (anche con la fotocamera
// nativa del telefono) l'app si apre già sul mezzo giusto.
export function vehicleUrl(vehicleId) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}?vehicle=${encodeURIComponent(vehicleId)}`
}

// Etichetta QR stampabile per un mezzo.
export default function VehicleQrLabel({ vehicle, onClose }) {
  const url = vehicleUrl(vehicle.id)
  const qr = qrcode(0, 'M')
  qr.addData(url)
  qr.make()
  const imgSrc = qr.createDataURL(6, 8)

  function print() {
    const w = window.open('', '_blank', 'width=420,height=560')
    if (!w) return
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>QR ${vehicle.name}</title>
      <style>
        body{font-family:system-ui,sans-serif;text-align:center;padding:24px;color:#1c2733}
        .name{font-size:22px;font-weight:700;margin:8px 0 2px}
        .plate{font-size:18px;letter-spacing:1px;color:#0d3b66;font-weight:600}
        img{width:260px;height:260px;image-rendering:pixelated;margin:16px 0}
        .hint{font-size:12px;color:#6b7785;margin-top:8px}
      </style></head><body>
      <div class="name">${vehicle.name}</div>
      <div class="plate">${vehicle.plate || ''}</div>
      <img src="${imgSrc}" alt="QR">
      <div class="hint">Inquadra per la presa in carico</div>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`)
    w.document.close()
  }

  return (
    <div className="qr-label">
      <img className="qr-img" src={imgSrc} alt={`QR ${vehicle.name}`} />
      <div className="qr-meta">
        <strong>{vehicle.name}</strong>
        <span>{vehicle.plate || '—'}</span>
      </div>
      <p className="muted small qr-url">{url}</p>
      <div className="decision-actions">
        <button className="btn-ghost" onClick={onClose}>Chiudi</button>
        <button className="btn-primary" onClick={print}>Stampa etichetta</button>
      </div>
    </div>
  )
}
