import { AREAS } from './areas.jsx'

// Schermata iniziale dell'app: l'utente sceglie in quale macro-area entrare.
export default function Hub({ onSelect }) {
  return (
    <div className="hub">
      <div className="login-brand">
        <img className="login-logo" src="./greeneco-logo.jpeg" alt="greeneco wastewater" />
        <h1>Servizi di campo</h1>
        <p>Scegli un’area per iniziare</p>
      </div>

      <div className="hub-grid">
        {AREAS.map((area) => (
          <button
            key={area.id}
            className="area-card"
            style={{ '--accent': area.accent }}
            onClick={() => onSelect(area.id)}
          >
            <span className="area-icon">
              <area.Icon />
            </span>
            <span className="area-text">
              <span className="area-title">{area.title}</span>
              <span className="area-sub">{area.subtitle}</span>
            </span>
            {!area.ready && <span className="area-soon">In arrivo</span>}
            <span className="area-arrow" aria-hidden>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
