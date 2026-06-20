import { useEffect, useState } from 'react'
import { login } from './data/api.js'
import Hub from './components/Hub.jsx'
import Login from './components/Login.jsx'
import Header from './components/Header.jsx'
import EmployeeHome from './components/EmployeeHome.jsx'
import ManagerHome from './components/ManagerHome.jsx'
import ComingSoon from './components/ComingSoon.jsx'

const SESSION_KEY = 'straordinari_session'

export default function App() {
  // Area selezionata nella schermata iniziale (null = mostra l'hub).
  const [area, setArea] = useState(null)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // Ripristina la sessione precedente all'avvio dell'app.
  useEffect(() => {
    const savedId = localStorage.getItem(SESSION_KEY)
    if (savedId) {
      login(savedId)
        .then(setUser)
        .catch(() => localStorage.removeItem(SESSION_KEY))
        .finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [])

  async function handleLogin(userId) {
    const u = await login(userId)
    localStorage.setItem(SESSION_KEY, u.id)
    setUser(u)
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  function backToHub() {
    setArea(null)
  }

  if (!ready) return null

  // Schermata iniziale: scelta della macro-area.
  if (!area) return <Hub onSelect={setArea} />

  // Area "Gestione straordinari": flusso esistente (login + home per ruolo).
  if (area === 'straordinari') {
    if (!user) return <Login onLogin={handleLogin} onBack={backToHub} />
    return (
      <div className="app">
        <Header user={user} onLogout={handleLogout} onBack={backToHub} />
        {user.role === 'manager' ? (
          <ManagerHome user={user} />
        ) : (
          <EmployeeHome user={user} />
        )}
      </div>
    )
  }

  // Altre aree: ancora in sviluppo.
  return <ComingSoon area={area} onBack={backToHub} />
}
