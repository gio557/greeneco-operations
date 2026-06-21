import { useState } from 'react'
import RequestsBoard from './RequestsBoard.jsx'
import UsersAdmin from './UsersAdmin.jsx'

// Dashboard di manager e admin.
// - Manager: vede e gestisce le richieste del proprio team.
// - Admin: vede e gestisce TUTTE le richieste e, in più, gli utenti
//   (ID e password di manager e dipendenti).
export default function Dashboard({ user }) {
  const isAdmin = user.role === 'admin'
  const [view, setView] = useState('requests')

  return (
    <main className="content dashboard">
      {isAdmin && (
        <div className="dash-tabs">
          <button
            className={view === 'requests' ? 'dash-tab dash-tab-active' : 'dash-tab'}
            onClick={() => setView('requests')}
          >
            Richieste
          </button>
          <button
            className={view === 'users' ? 'dash-tab dash-tab-active' : 'dash-tab'}
            onClick={() => setView('users')}
          >
            Utenti
          </button>
        </div>
      )}

      {view === 'users' && isAdmin ? (
        <UsersAdmin admin={user} />
      ) : (
        <RequestsBoard user={user} />
      )}
    </main>
  )
}
