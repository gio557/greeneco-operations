import { useEffect, useMemo, useState } from 'react'
import { adminListUsers, adminUpsertUser, adminDeleteUser } from '../data/api.js'

const ROLE_LABELS = { admin: 'Amministratore', manager: 'Manager', employee: 'Dipendente' }

// Pannello di amministrazione utenti (solo admin): crea, modifica, elimina
// utenti e ne imposta ID e password.
export default function UsersAdmin({ admin }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | {user} | 'new'

  async function load() {
    setLoading(true)
    setError('')
    try {
      setUsers(await adminListUsers(admin.id))
    } catch (err) {
      setError(err.message || 'Errore nel caricamento utenti.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin.id])

  const managers = useMemo(() => users.filter((u) => u.role === 'manager'), [users])

  async function remove(user) {
    if (!window.confirm(`Eliminare l'utente "${user.name}" (${user.id})?`)) return
    try {
      await adminDeleteUser(admin.id, user.id)
      await load()
    } catch (err) {
      window.alert(err.message || 'Eliminazione non riuscita.')
    }
  }

  if (editing) {
    return (
      <UserForm
        admin={admin}
        user={editing === 'new' ? null : editing}
        managers={managers}
        onCancel={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null)
          await load()
        }}
      />
    )
  }

  return (
    <div className="board">
      <div className="dash-filters">
        <h2 className="section-title">Utenti</h2>
        <button className="btn-primary btn-sm" onClick={() => setEditing('new')}>
          + Nuovo utente
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted center">Caricamento…</p>
      ) : (
        <div className="table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>ID</th>
                <th>Ruolo</th>
                <th>Reparto</th>
                <th>Password</th>
                <th className="actions-col">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Nome">{u.name}</td>
                  <td data-label="ID"><code>{u.id}</code></td>
                  <td data-label="Ruolo">{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td data-label="Reparto">{u.department ?? '—'}</td>
                  <td data-label="Password">
                    {u.hasPassword ? (
                      <span className="badge badge-approved">impostata</span>
                    ) : (
                      <span className="badge badge-rejected">assente</span>
                    )}
                  </td>
                  <td data-label="Azioni" className="actions-col">
                    <button className="btn-ghost btn-sm" onClick={() => setEditing(u)}>
                      Modifica
                    </button>
                    {u.id !== admin.id && (
                      <button className="btn-ghost btn-sm danger" onClick={() => remove(u)}>
                        Elimina
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="login-hint">
        L'ID identifica l'utente per l'accesso e non è modificabile dopo la
        creazione. La password viene salvata cifrata; lasciala vuota in modifica
        per non cambiarla.
      </p>
    </div>
  )
}

function UserForm({ admin, user, managers, onCancel, onSaved }) {
  const isNew = !user
  const [form, setForm] = useState({
    id: user?.id ?? '',
    name: user?.name ?? '',
    role: user?.role ?? 'employee',
    department: user?.department ?? '',
    email: user?.email ?? '',
    managerId: user?.managerId ?? '',
    password: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (isNew && !form.password) {
      setError('Imposta una password per il nuovo utente.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await adminUpsertUser(admin.id, {
        ...form,
        managerId: form.role === 'employee' ? form.managerId : '',
      })
      await onSaved()
    } catch (err) {
      setError(err.message || 'Salvataggio non riuscito.')
      setBusy(false)
    }
  }

  return (
    <div className="board">
      <button className="back-link" onClick={onCancel}>‹ Torna all'elenco</button>
      <h2 className="section-title">{isNew ? 'Nuovo utente' : `Modifica ${user.name}`}</h2>

      <form className="user-form" onSubmit={submit}>
        <label className="field">
          <span className="field-label">ID utente</span>
          <input
            className="input"
            value={form.id}
            onChange={(e) => set('id', e.target.value)}
            placeholder="es. emp-7"
            autoCapitalize="none"
            disabled={!isNew}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Nome e cognome</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Ruolo</span>
          <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="employee">Dipendente</option>
            <option value="manager">Manager</option>
            <option value="admin">Amministratore</option>
          </select>
        </label>

        {form.role === 'employee' && (
          <label className="field">
            <span className="field-label">Manager di riferimento</span>
            <select
              className="input"
              value={form.managerId}
              onChange={(e) => set('managerId', e.target.value)}
            >
              <option value="">— nessuno —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
              ))}
            </select>
          </label>
        )}

        <label className="field">
          <span className="field-label">Reparto</span>
          <input
            className="input"
            value={form.department}
            onChange={(e) => set('department', e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoCapitalize="none"
          />
        </label>

        <label className="field">
          <span className="field-label">
            Password {isNew ? '' : '(lascia vuoto per non cambiarla)'}
          </span>
          <input
            className="input"
            type="text"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="new-password"
            placeholder={isNew ? 'Password di accesso' : '••••••'}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="decision-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>Annulla</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </form>
    </div>
  )
}
