import { getArea } from './areas.jsx'

// Schermata segnaposto per le aree non ancora sviluppate.
export default function ComingSoon({ area, onBack }) {
  const info = getArea(area)
  if (!info) return null

  return (
    <div className="hub">
      <button className="back-link" onClick={onBack}>‹ Torna alle aree</button>

      <div className="soon-card">
        <span className="soon-icon" style={{ '--accent': info.accent }}>
          <info.Icon />
        </span>
        <h1 className="soon-title">{info.title}</h1>
        <p className="soon-sub">{info.subtitle}</p>
        <span className="soon-badge">Area in arrivo</span>
        <p className="muted center soon-text">
          Questa sezione è in fase di sviluppo. A breve potrai gestirla
          direttamente da qui, come la sezione straordinari.
        </p>
      </div>
    </div>
  )
}
