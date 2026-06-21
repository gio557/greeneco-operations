-- ===========================================================================
-- Gestione Straordinari — Schema del database centrale (Supabase / PostgreSQL)
--
-- COME USARLO:
--   1. Crea un progetto gratuito su https://supabase.com
--   2. Apri "SQL Editor" → "New query"
--   3. Incolla TUTTO questo file e premi "Run"
--
-- Lo script è idempotente: puoi rieseguirlo senza errori (non duplica i dati).
-- Se aggiorni da una versione precedente, ri-eseguilo: aggiunge il ruolo
-- "admin", le credenziali con password e le funzioni di accesso/gestione.
--
-- ACCESSO (fase attuale — prototipo):
--   L'accesso avviene con ID/email + password. Le password sono salvate
--   CIFRATE (bcrypt) in una tabella separata `user_credentials`, NON leggibile
--   dal browser: la verifica avviene solo tramite funzioni sicure lato database
--   (SECURITY DEFINER). L'utente con ruolo "admin" gestisce gli altri utenti.
--
--   NOTA: per una futura versione "reale" l'autenticazione andrà rifatta in
--   modo pienamente GDPR-compliant (Supabase Auth, gestione consensi, ecc.).
-- ===========================================================================

-- pgcrypto fornisce crypt()/gen_salt() per le password cifrate (bcrypt).
create extension if not exists pgcrypto with schema extensions;

-- Includi lo schema "extensions" nel percorso di ricerca per usare crypt().
set search_path = public, extensions;

-- --- Tabelle ----------------------------------------------------------------

-- Profili utente (id testuali, come nel prototipo: 'mgr-1', 'emp-1', ...)
create table if not exists public.profiles (
  id          text primary key,
  name        text not null,
  role        text not null,
  department  text,
  manager_id  text references public.profiles (id),
  email       text,
  created_at  timestamptz not null default now()
);

-- Consenti il ruolo "admin" (aggiorna il vincolo anche su DB già esistenti).
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('employee', 'manager', 'admin'));

-- Credenziali di accesso: password CIFRATA, in tabella separata e protetta.
create table if not exists public.user_credentials (
  user_id    text primary key references public.profiles (id) on delete cascade,
  password   text not null,
  updated_at timestamptz not null default now()
);

-- Richieste di straordinario
create table if not exists public.overtime_requests (
  id            text primary key,
  employee_id   text not null references public.profiles (id),
  manager_id    text references public.profiles (id),
  work_date     date not null,
  hours         numeric(4, 1) not null check (hours > 0),
  reason        text not null,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  decision_note text default '',
  decided_by    text references public.profiles (id),
  created_at    timestamptz not null default now(),
  decided_at    timestamptz
);

-- Indici utili per le query dell'app
create index if not exists overtime_requests_employee_idx
  on public.overtime_requests (employee_id);
create index if not exists overtime_requests_manager_idx
  on public.overtime_requests (manager_id);

-- --- Sicurezza (Row Level Security) -----------------------------------------
-- I profili (SENZA password) sono leggibili; le richieste sono leggibili e
-- scrivibili con la chiave pubblica "anon". Le PASSWORD stanno in
-- user_credentials, che ha RLS attiva e NESSUNA policy: quindi è inaccessibile
-- dal browser e si può leggere/scrivere solo tramite le funzioni qui sotto.

alter table public.profiles enable row level security;
alter table public.user_credentials enable row level security;
alter table public.overtime_requests enable row level security;

drop policy if exists "profiles_select_anon" on public.profiles;
create policy "profiles_select_anon"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "requests_select_anon" on public.overtime_requests;
create policy "requests_select_anon"
  on public.overtime_requests for select
  to anon, authenticated
  using (true);

drop policy if exists "requests_insert_anon" on public.overtime_requests;
create policy "requests_insert_anon"
  on public.overtime_requests for insert
  to anon, authenticated
  with check (true);

drop policy if exists "requests_update_anon" on public.overtime_requests;
create policy "requests_update_anon"
  on public.overtime_requests for update
  to anon, authenticated
  using (true)
  with check (true);

-- --- Funzioni di accesso e amministrazione ----------------------------------
-- Tutte SECURITY DEFINER: girano con privilegi elevati, così possono leggere
-- le credenziali cifrate senza esporle al client.

-- Converte una riga "profiles" nell'oggetto usato dalla UI (camelCase).
create or replace function public.app_user_json(p public.profiles)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'role', p.role,
    'department', p.department,
    'managerId', p.manager_id,
    'email', p.email
  );
$$;

-- Login: identifica per id o email e verifica la password cifrata.
-- Ritorna il profilo (senza password) se le credenziali sono corrette.
create or replace function public.app_login(p_identifier text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile public.profiles;
  v_hash    text;
begin
  select pr.* into v_profile
  from public.profiles pr
  where pr.id = p_identifier
     or lower(pr.email) = lower(p_identifier)
  limit 1;

  if v_profile.id is null then
    return null;
  end if;

  select c.password into v_hash
  from public.user_credentials c
  where c.user_id = v_profile.id;

  if v_hash is null then
    return null; -- nessuna password impostata: accesso non consentito
  end if;

  if crypt(p_password, v_hash) = v_hash then
    return public.app_user_json(v_profile);
  end if;

  return null;
end;
$$;

-- Verifica che un id corrisponda a un utente con ruolo "admin".
create or replace function public.app_is_admin(p_admin_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_admin_id and role = 'admin'
  );
$$;

-- Elenco utenti per l'admin (senza password; con flag "hasPassword").
create or replace function public.admin_list_users(p_admin_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not public.app_is_admin(p_admin_id) then
    raise exception 'Non autorizzato';
  end if;

  select coalesce(
    jsonb_agg(
      public.app_user_json(pr) || jsonb_build_object('hasPassword', c.user_id is not null)
      order by
        case pr.role when 'admin' then 0 when 'manager' then 1 else 2 end,
        pr.name
    ),
    '[]'::jsonb
  )
  into v
  from public.profiles pr
  left join public.user_credentials c on c.user_id = pr.id;

  return v;
end;
$$;

-- Crea o aggiorna un utente; se p_password è valorizzata, (re)imposta la
-- password cifrata. Solo l'admin può eseguirla.
create or replace function public.admin_upsert_user(
  p_admin_id   text,
  p_id         text,
  p_name       text,
  p_role       text,
  p_department text,
  p_manager_id text,
  p_email      text,
  p_password   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile public.profiles;
begin
  if not public.app_is_admin(p_admin_id) then
    raise exception 'Non autorizzato';
  end if;

  if coalesce(p_id, '') = '' or coalesce(p_name, '') = '' then
    raise exception 'ID e nome sono obbligatori';
  end if;

  if p_role not in ('employee', 'manager', 'admin') then
    raise exception 'Ruolo non valido';
  end if;

  insert into public.profiles (id, name, role, department, manager_id, email)
  values (
    p_id,
    p_name,
    p_role,
    nullif(p_department, ''),
    nullif(p_manager_id, ''),
    nullif(p_email, '')
  )
  on conflict (id) do update set
    name       = excluded.name,
    role       = excluded.role,
    department = excluded.department,
    manager_id = excluded.manager_id,
    email      = excluded.email
  returning * into v_profile;

  if coalesce(p_password, '') <> '' then
    insert into public.user_credentials (user_id, password, updated_at)
    values (p_id, crypt(p_password, gen_salt('bf')), now())
    on conflict (user_id) do update set
      password   = excluded.password,
      updated_at = now();
  end if;

  return public.app_user_json(v_profile);
end;
$$;

-- Elimina un utente (le sue credenziali vengono rimosse a cascata).
create or replace function public.admin_delete_user(p_admin_id text, p_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.app_is_admin(p_admin_id) then
    raise exception 'Non autorizzato';
  end if;

  if p_admin_id = p_user_id then
    raise exception 'Non puoi eliminare il tuo stesso account';
  end if;

  if exists (
    select 1 from public.overtime_requests
    where employee_id = p_user_id
       or manager_id = p_user_id
       or decided_by = p_user_id
  ) then
    raise exception 'Impossibile eliminare: l''utente ha richieste collegate';
  end if;

  delete from public.profiles where id = p_user_id;
end;
$$;

-- Permessi di esecuzione per la chiave pubblica.
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.admin_list_users(text) to anon, authenticated;
grant execute on function public.admin_upsert_user(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_delete_user(text, text) to anon, authenticated;

-- --- Tempo reale ------------------------------------------------------------
-- Abilita le notifiche realtime sulle richieste (idempotente).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'overtime_requests'
  ) then
    alter publication supabase_realtime add table public.overtime_requests;
  end if;
end $$;

-- --- Dati demo iniziali -----------------------------------------------------
-- Gli stessi utenti del prototipo, più un account amministratore.
-- Sostituiscili pure con i veri dipendenti/manager (anche dalla dashboard).

insert into public.profiles (id, name, role, department, manager_id, email) values
  ('admin', 'Amministratore', 'admin',    'Direzione',  null,    'admin@azienda.it'),
  ('mgr-1', 'Laura Bianchi',  'manager',  'Produzione', null,    'laura.bianchi@azienda.it'),
  ('mgr-2', 'Marco Verdi',    'manager',  'Logistica',  null,    'marco.verdi@azienda.it'),
  ('emp-1', 'Giulia Rossi',   'employee', 'Produzione', 'mgr-1', 'giulia.rossi@azienda.it'),
  ('emp-2', 'Antonio Russo',  'employee', 'Produzione', 'mgr-1', 'antonio.russo@azienda.it'),
  ('emp-3', 'Sara Colombo',   'employee', 'Logistica',  'mgr-2', 'sara.colombo@azienda.it')
on conflict (id) do nothing;

-- Password demo (cifrate). on conflict do nothing: non sovrascrive password già
-- impostate, così le modifiche fatte dalla dashboard non vengono perse.
--   admin → admin123   ·   tutti gli altri → demo123
insert into public.user_credentials (user_id, password) values
  ('admin', crypt('admin123', gen_salt('bf'))),
  ('mgr-1', crypt('demo123',  gen_salt('bf'))),
  ('mgr-2', crypt('demo123',  gen_salt('bf'))),
  ('emp-1', crypt('demo123',  gen_salt('bf'))),
  ('emp-2', crypt('demo123',  gen_salt('bf'))),
  ('emp-3', crypt('demo123',  gen_salt('bf')))
on conflict (user_id) do nothing;

insert into public.overtime_requests
  (id, employee_id, manager_id, work_date, hours, reason, status, decision_note, decided_by, created_at, decided_at) values
  ('req-1001', 'emp-1', 'mgr-1', current_date + 1, 2,   'Completamento ordine urgente cliente Alfa', 'pending',  '',                                     null,    now() - interval '1 hour',  null),
  ('req-1002', 'emp-2', 'mgr-1', current_date + 2, 3,   'Manutenzione straordinaria linea 2',        'pending',  '',                                     null,    now() - interval '2 hour',  null),
  ('req-1003', 'emp-1', 'mgr-1', current_date - 3, 1.5, 'Inventario di fine mese',                   'approved', 'Approvato, ricordati di timbrare.',    'mgr-1', now() - interval '4 day',   now() - interval '3 day'),
  ('req-1004', 'emp-3', 'mgr-2', current_date - 1, 4,   'Carico camion serale non previsto',         'rejected', 'Coperto da turno notturno, non necessario.', 'mgr-2', now() - interval '2 day', now() - interval '1 day')
on conflict (id) do nothing;
