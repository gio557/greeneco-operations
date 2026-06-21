import { useMemo, useState } from 'react'
import {
  listVehicles,
  getRecentHandovers,
  getAllIssues,
  getUserMap,
  resolveIssue,
  subscribeToVehicleData,
} from '../data/api.js'
import { useLiveData } from '../data/useLiveData.js'
import { formatDateTime } from '../utils.js'

// Vista di controllo mezzi per manager/admin: stato, segnalazioni e storico
// delle prese in carico.
export default function VehiclesBoard({ user }) {
  const [vehicles, setVehicles] = useState([])
  const [handovers, setHandovers] = useState([])
  const [issues, setIssues] = useState([])
  const [userMap, setUserMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  async function refresh(showSpinner = false) {
    if (showSpinner) setLoading(true)
    const [vs, hs, is, map] = await Promise.all([
      listVehicles(),
      getRecentHandovers(300),
      getAllIssues(),
      getUserMap(),
    ])
    setVehicles(vs)
    setHandovers(hs)
    setIssues(is)
    setUserMap(map)
    setLoading(false)
  }

  useLiveData(refresh, [user.id], subscribeToVehicleData)

  const openIssues = useMemo(() => issues.filter((i) => i.status === 'open'), [issues])

  const byVehicle = useMemo(() => {
    const map = {}
    for (const v of vehicles) map[v.id] = { vehicle: v, open: 0, last: null }
    for (const i of openIssues) if (map[i.vehicleId]) map[i.vehicleId].open++
    for (const h of handovers) {
      const e = map[h.vehicleId]
      if (e && (!e.last || h.takenAt > e.last.takenAt)) e.last = h
    }
    return map
  }, [vehicles, openIssues, handovers])

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return handovers.filter((h) => (h.takenAt || '').slice(0, 10) === today).length
  }, [handovers])

  async function resolve(issueId) {
    try {
      await resolveIssue(issueId, user.id)
      await refresh()
    } catch (err) {
      window.alert(err.message || 'Operazione non riuscita.')
    }
  }

  const name = (id) => userMap[id]?.name ?? id ?? '—'

  // --- Dettaglio mezzo ---
  if (selected) {
    const v = vehicles.find((x) => x.id === selected)
    const vIssuesOpen = issues.filter((i) => i.vehicleId === selected && i.status === 'open')
    const vIssuesDone = issues.filter((i) => i.vehicleId === selected && i.status === 'resolved')
    const vHandovers = handovers.filter((h) => h.vehicleId === selected)
    return (
      <div className="board">
        <button className="back-link" onClick={() => setSelected(null)}>‹ Tutti i mezzi</button>
        {v && (
          <div className="vehicle-head">
            <h2 className="section-title" style={{ margin: 0 }}>{v.name}</h2>
            <span className="vehicle-plate">{v.plate || '—'}</span>
          </div>
        )}

        <h3 className="mini-title">Segnalazioni aperte ({vIssuesOpen.length})</h3>
        {vIssuesOpen.length === 0 ? (
          <p className="muted small">Nessuna segnalazione aperta.</p>
        ) : (
          <div className="list">
            {vIssuesOpen.map((i) => (
              <div key={i.id} className="card issue-card">
                <div className="issue-card-main">
                  <p className="issue-desc">{i.description}</p>
                  <p className="muted small">
                    Segnalato da {name(i.reportedBy)} · {formatDateTime(i.reportedAt)}
                  </p>
                </div>
                {i.photoUrl && (
                  <a href={i.photoUrl} target="_blank" rel="noreferrer">
                    <img className="issue-thumb" src={i.photoUrl} alt="foto danno" />
                  </a>
                )}
                <button className="btn-ghost btn-sm" onClick={() => resolve(i.id)}>Risolvi</button>
              </div>
            ))}
          </div>
        )}

        <h3 className="mini-title">Storico prese in carico</h3>
        {vHandovers.length === 0 ? (
          <p className="muted small">Nessuna presa in carico registrata.</p>
        ) : (
          <div className="table-wrap">
            <table className="dash-table">
              <thead>
                <tr><th>Quando</th><th>Dipendente</th><th>Stato dichiarato</th></tr>
              </thead>
              <tbody>
                {vHandovers.map((h) => (
                  <tr key={h.id}>
                    <td data-label="Quando">{formatDateTime(h.takenAt)}</td>
                    <td data-label="Dipendente">{name(h.employeeId)}</td>
                    <td data-label="Stato dichiarato">
                      {h.conditionOk
                        ? <span className="badge badge-approved">nessun danno</span>
                        : <span className="badge badge-rejected">danno segnalato</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {vIssuesDone.length > 0 && (
          <>
            <h3 className="mini-title">Segnalazioni risolte</h3>
            <ul className="issue-list">
              {vIssuesDone.map((i) => (
                <li key={i.id} className="muted">
                  {i.description} — risolta da {name(i.resolvedBy)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    )
  }

  // --- Elenco mezzi ---
  return (
    <div className="board">
      <div className="stat-grid">
        <StatCard label="Mezzi" value={vehicles.length} />
        <StatCard label="Segnalazioni aperte" value={openIssues.length} accent={openIssues.length ? 'pending' : undefined} />
        <StatCard label="Prese in carico oggi" value={todayCount} />
      </div>

      {loading ? (
        <p className="muted center">Caricamento…</p>
      ) : vehicles.length === 0 ? (
        <div className="empty"><p>Nessun mezzo in anagrafica.</p></div>
      ) : (
        <div className="list">
          {vehicles.map((v) => {
            const info = byVehicle[v.id] || {}
            return (
              <button key={v.id} className="vehicle-row" onClick={() => setSelected(v.id)}>
                <span className="vehicle-row-main">
                  <span className="vehicle-pick-name">{v.name}</span>
                  <span className="vehicle-pick-sub">
                    {v.plate || '—'}
                    {info.last ? ` · ultima: ${name(info.last.employeeId)}, ${formatDateTime(info.last.takenAt)}` : ' · mai presa in carico'}
                  </span>
                </span>
                {info.open > 0 && <span className="count-pill">{info.open} aperte</span>}
                <span className="user-card-arrow" aria-hidden>›</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card${accent ? ` stat-${accent}` : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
