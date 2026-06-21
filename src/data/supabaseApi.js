// ---------------------------------------------------------------------------
// Implementazione del livello dati su SUPABASE (database centrale condiviso).
//
// Usata automaticamente quando le chiavi di Supabase sono configurate
// (vedi ./api.js e ./supabaseClient.js). Tutti i dispositivi leggono e
// scrivono sullo stesso archivio, quindi i dati sono sempre aggiornati ovunque.
//
// Accesso (prototipo): login con id/email + password verificata lato database
// da funzioni sicure (vedi supabase/schema.sql). L'utente "admin" gestisce gli
// altri utenti. La sicurezza fine (RLS su auth.uid) arriverà con il login reale.
// ---------------------------------------------------------------------------

import { supabase } from './supabaseClient.js'

const REQUESTS_TABLE = 'overtime_requests'
const PROFILES_TABLE = 'profiles'

// Converte una riga del database (snake_case) nell'oggetto usato dalla UI
// (camelCase), così i componenti non devono cambiare.
function rowToRequest(r) {
  return {
    id: r.id,
    employeeId: r.employee_id,
    managerId: r.manager_id,
    date: r.work_date,
    hours: Number(r.hours),
    reason: r.reason,
    status: r.status,
    decisionNote: r.decision_note ?? '',
    decidedBy: r.decided_by,
    createdAt: r.created_at,
    decidedAt: r.decided_at,
  }
}

function rowToUser(p) {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    department: p.department,
    managerId: p.manager_id ?? undefined,
    email: p.email,
  }
}

export async function listUsers() {
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('*')
    .order('role', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data.map(rowToUser)
}

// Login con identificativo (id o email) + password. La verifica avviene lato
// database (funzione sicura app_login): la password non transita mai nelle
// query come testo confrontabile né viene esposta al client.
export async function login(identifier, password) {
  const { data, error } = await supabase.rpc('app_login', {
    p_identifier: (identifier || '').trim(),
    p_password: password || '',
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Credenziali non valide')
  // La funzione restituisce già l'oggetto profilo in formato camelCase.
  return data
}

export async function getRequestsForEmployee(employeeId) {
  const { data, error } = await supabase
    .from(REQUESTS_TABLE)
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map(rowToRequest)
}

export async function getRequestsForManager(managerId) {
  const { data, error } = await supabase
    .from(REQUESTS_TABLE)
    .select('*')
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map(rowToRequest)
}

// Tutte le richieste dell'azienda (vista admin).
export async function getAllRequests() {
  const { data, error } = await supabase
    .from(REQUESTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map(rowToRequest)
}

export async function createRequest({ employeeId, date, hours, reason }) {
  // Il manager destinatario è quello associato al dipendente.
  const { data: employee, error: empError } = await supabase
    .from(PROFILES_TABLE)
    .select('manager_id')
    .eq('id', employeeId)
    .maybeSingle()
  if (empError) throw new Error(empError.message)
  if (!employee) throw new Error('Dipendente non trovato')

  const row = {
    id: `req-${Date.now()}`,
    employee_id: employeeId,
    manager_id: employee.manager_id,
    work_date: date,
    hours: Number(hours),
    reason: reason.trim(),
    status: 'pending',
    decision_note: '',
  }
  const { data, error } = await supabase
    .from(REQUESTS_TABLE)
    .insert(row)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return rowToRequest(data)
}

export async function decideRequest({ requestId, decision, note, managerId }) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Decisione non valida')
  }
  // Controllo di autorizzazione lato app: il manager può decidere sulle
  // richieste del proprio team; l'admin su qualsiasi richiesta. (Verrà
  // rafforzato con RLS quando ci sarà il login reale.)
  const { data: existing, error: getError } = await supabase
    .from(REQUESTS_TABLE)
    .select('manager_id')
    .eq('id', requestId)
    .maybeSingle()
  if (getError) throw new Error(getError.message)
  if (!existing) throw new Error('Richiesta non trovata')
  if (existing.manager_id !== managerId) {
    const { data: actor } = await supabase
      .from(PROFILES_TABLE)
      .select('role')
      .eq('id', managerId)
      .maybeSingle()
    if (!actor || actor.role !== 'admin') {
      throw new Error('Non sei autorizzato a gestire questa richiesta')
    }
  }

  const { data, error } = await supabase
    .from(REQUESTS_TABLE)
    .update({
      status: decision,
      decision_note: (note || '').trim(),
      decided_by: managerId,
      decided_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return rowToRequest(data)
}

export async function getUserMap() {
  const users = await listUsers()
  const map = {}
  for (const u of users) map[u.id] = u
  return map
}

// --- Amministrazione utenti (solo ruolo "admin") --------------------------
// L'autorizzazione è verificata lato database dalle funzioni admin_*.

export async function adminListUsers(adminId) {
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_admin_id: adminId,
  })
  if (error) throw new Error(error.message)
  return data || []
}

export async function adminUpsertUser(adminId, user) {
  const { data, error } = await supabase.rpc('admin_upsert_user', {
    p_admin_id: adminId,
    p_id: (user.id || '').trim(),
    p_name: (user.name || '').trim(),
    p_role: user.role,
    p_department: user.department || '',
    p_manager_id: user.managerId || '',
    p_email: user.email || '',
    p_password: user.password || '',
  })
  if (error) throw new Error(error.message)
  return data
}

export async function adminDeleteUser(adminId, userId) {
  const { error } = await supabase.rpc('admin_delete_user', {
    p_admin_id: adminId,
    p_user_id: userId,
  })
  if (error) throw new Error(error.message)
}

// Con il database centrale i dati sono condivisi: il reset dei dati demo non è
// disponibile (eviterebbe di cancellare per errore i dati di tutti).
export async function resetDemoData() {
  throw new Error('Reset non disponibile: i dati sono sul database centrale.')
}

// Aggiornamenti in TEMPO REALE: invoca onChange a ogni inserimento/modifica
// delle richieste, così le altre app (su altri telefoni) si aggiornano da sole.
// Ritorna una funzione di "annulla sottoscrizione" da chiamare alla pulizia.
export function subscribeToRequests(onChange) {
  const channel = supabase
    .channel('overtime_requests_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: REQUESTS_TABLE },
      onChange
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
