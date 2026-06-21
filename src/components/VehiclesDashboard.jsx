import { useState } from 'react'
import VehiclesBoard from './VehiclesBoard.jsx'
import VehiclesAdmin from './VehiclesAdmin.jsx'

// Sezione automezzi per manager/admin: stato e storico mezzi; l'admin gestisce
// anche l'anagrafica e i QR.
export default function VehiclesDashboard({ user }) {
  const isAdmin = user.role === 'admin'
  const [view, setView] = useState('board')

  return (
    <main className="content dashboard">
      {isAdmin && (
        <div className="dash-tabs">
          <button
            className={view === 'board' ? 'dash-tab dash-tab-active' : 'dash-tab'}
            onClick={() => setView('board')}
          >
            Stato mezzi
          </button>
          <button
            className={view === 'admin' ? 'dash-tab dash-tab-active' : 'dash-tab'}
            onClick={() => setView('admin')}
          >
            Anagrafica & QR
          </button>
        </div>
      )}

      {view === 'admin' && isAdmin ? (
        <VehiclesAdmin admin={user} />
      ) : (
        <VehiclesBoard user={user} />
      )}
    </main>
  )
}
