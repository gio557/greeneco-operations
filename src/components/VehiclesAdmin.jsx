import { useEffect, useState } from 'react'
import { adminListVehicles, adminUpsertVehicle, adminDeleteVehicle } from '../data/api.js'
import VehicleQrLabel from './VehicleQrLabel.jsx'

// Gestione anagrafica mezzi (solo admin): crea/modifica/elimina e genera il QR.
export default function VehiclesAdmin({ admin }) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | vehicle | 'new'
  const [qrFor, setQrFor] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setVehicles(await adminListVehicles(admin.id))
    } catch (err) {
      setError(err.message || 'Errore nel caricamento mezzi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin.id])

  async function remove(v) {
    if (!window.confirm(`Eliminare il mezzo "${v.name}" (${v.id})?`)) return
    try {
      await adminDeleteVehicle(admin.id, v.id)
      await load()
    } catch (err) {
      window.alert(err.message || 'Eliminazione non riuscita.')
    }
  }

  if (editing) {
    return (
      <VehicleForm
        admin={admin}
        vehicle={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={async () => { setEditing(null); await load() }}
      />
    )
  }

  return (
    <div className="board">
      <div className="dash-filters">
        <h2 className="section-title">Mezzi</h2>
        <button className="btn-primary btn-sm" onClick={() => setEditing('new')}>+ Nuovo mezzo</button>
      </div>

      {error && <p className="error">{error}</p>}

      {qrFor && (
        <div className="qr-overlay" onClick={() => setQrFor(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <VehicleQrLabel vehicle={qrFor} onClose={() => setQrFor(null)} />
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted center">Caricamento…</p>
      ) : (
        <div className="table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Mezzo</th>
                <th>Targa</th>
                <th>Reparto</th>
                <th>Stato</th>
                <th className="actions-col">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td data-label="Mezzo">{v.name} <code>{v.id}</code></td>
                  <td data-label="Targa">{v.plate || '—'}</td>
                  <td data-label="Reparto">{v.department || '—'}</td>
                  <td data-label="Stato">
                    {v.active !== false
                      ? <span className="badge badge-approved">attivo</span>
                      : <span className="badge badge-rejected">disattivo</span>}
                  </td>
                  <td data-label="Azioni" className="actions-col">
                    <button className="btn-ghost btn-sm" onClick={() => setQrFor(v)}>QR</button>
                    <button className="btn-ghost btn-sm" onClick={() => setEditing(v)}>Modifica</button>
                    <button className="btn-ghost btn-sm danger" onClick={() => remove(v)}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="login-hint">
        Il pulsante <strong>QR</strong> genera l'etichetta da stampare e applicare
        sul mezzo: inquadrandola, il dipendente apre direttamente la presa in carico.
      </p>
    </div>
  )
}

function VehicleForm({ admin, vehicle, onCancel, onSaved }) {
  const isNew = !vehicle
  const [form, setForm] = useState({
    id: vehicle?.id ?? '',
    name: vehicle?.name ?? '',
    plate: vehicle?.plate ?? '',
    department: vehicle?.department ?? '',
    active: vehicle?.active !== false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (f, val) => setForm((s) => ({ ...s, [f]: val }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await adminUpsertVehicle(admin.id, form)
      await onSaved()
    } catch (err) {
      setError(err.message || 'Salvataggio non riuscito.')
      setBusy(false)
    }
  }

  return (
    <div className="board">
      <button className="back-link" onClick={onCancel}>‹ Torna all'elenco</button>
      <h2 className="section-title">{isNew ? 'Nuovo mezzo' : `Modifica ${vehicle.name}`}</h2>

      <form className="user-form" onSubmit={submit}>
        <label className="field">
          <span className="field-label">ID mezzo</span>
          <input className="input" value={form.id} onChange={(e) => set('id', e.target.value)}
            placeholder="es. veh-4" autoCapitalize="none" disabled={!isNew} required />
        </label>
        <label className="field">
          <span className="field-label">Nome / modello</span>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="es. Fiat Ducato" required />
        </label>
        <label className="field">
          <span className="field-label">Targa</span>
          <input className="input" value={form.plate} onChange={(e) => set('plate', e.target.value)}
            placeholder="es. AB123CD" autoCapitalize="characters" />
        </label>
        <label className="field">
          <span className="field-label">Reparto</span>
          <input className="input" value={form.department} onChange={(e) => set('department', e.target.value)} />
        </label>
        <label className="field-check">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          <span>Mezzo attivo (selezionabile per la presa in carico)</span>
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
