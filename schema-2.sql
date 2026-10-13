-- Diario Cani, aggiornamento 2: famiglia, link per il veterinario, crisi dalla schermata di blocco, documenti.
-- Incolla tutto nel "SQL Editor" di Supabase e premi Run (si può rieseguire senza problemi).

-- Chi può vedere e scrivere i dati di un proprietario (es. la mamma)
create table if not exists public.pet_members (
  owner uuid not null references auth.users on delete cascade,
  member uuid not null references auth.users on delete cascade,
  member_email text,
  primary key (owner, member)
);
alter table public.pet_members enable row level security;
drop policy if exists "vedo i miei legami" on public.pet_members;
create policy "vedo i miei legami" on public.pet_members for select using (auth.uid() in (owner, member));
drop policy if exists "il proprietario toglie" on public.pet_members;
create policy "il proprietario toglie" on public.pet_members for delete using (auth.uid() = owner);

-- Codici privati: invito famiglia, link veterinario, comando rapido crisi
create table if not exists public.pet_links (
  token text primary key,
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  scope text not null check (scope in ('vet', 'rapida', 'invito')),
  created_at timestamptz not null default now()
);
alter table public.pet_links enable row level security;
drop policy if exists "i miei codici" on public.pet_links;
create policy "i miei codici" on public.pet_links for all using (auth.uid() = owner) with check (auth.uid() = owner);

create or replace function public.pet_can(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() = o or exists (select 1 from pet_members where owner = o and member = auth.uid())
$$;

drop policy if exists "solo i miei dati cani" on public.pet_records;
drop policy if exists "dati cani di famiglia" on public.pet_records;
create policy "dati cani di famiglia" on public.pet_records for all
  using (public.pet_can(user_id)) with check (public.pet_can(user_id));

-- La mamma inserisce il codice invito e vede i dati dei cani
create or replace function public.join_family(code text) returns text
language plpgsql security definer set search_path = public as $$
declare o uuid;
begin
  select owner into o from pet_links where token = upper(trim(code)) and scope = 'invito';
  if o is null then raise exception 'Codice non valido'; end if;
  if o = auth.uid() then raise exception 'Questo è il tuo stesso codice'; end if;
  insert into pet_members (owner, member, member_email) values (o, auth.uid(), auth.jwt() ->> 'email') on conflict do nothing;
  return 'ok';
end $$;
revoke execute on function public.join_family(text) from anon;
grant execute on function public.join_family(text) to authenticated;

-- Report in sola lettura per il veterinario (link privato)
create or replace function public.vet_report(t text)
returns table (id uuid, dog text, kind text, data jsonb, updated bigint)
language sql stable security definer set search_path = public as $$
  select r.id, r.dog, r.kind, r.data, r.updated from pet_records r
  join pet_links l on l.owner = r.user_id
  where l.token = t and l.scope = 'vet' and not r.deleted and r.kind not in ('dose', 'programma')
$$;
grant execute on function public.vet_report(text) to anon, authenticated;

-- Crisi dalla schermata di blocco: 1ª pressione = inizio, 2ª pressione = fine (calcola la durata)
create or replace function public.crisi_rapida(t text, cane text default 'kafka') returns text
language plpgsql security definer set search_path = public as $$
declare
  o uuid; r pet_records; secs int;
  now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  loc timestamp := clock_timestamp() at time zone 'Europe/Rome';
begin
  select owner into o from pet_links where token = t and scope = 'rapida';
  if o is null then return 'Codice non valido: rifai il comando rapido dall''app'; end if;
  select * into r from pet_records
    where user_id = o and pet_records.dog = cane and kind = 'crisi' and not deleted and data ->> 'live' = 'true'
      and (data ->> 'startTs')::bigint > now_ms - 3 * 3600 * 1000
    order by updated desc limit 1;
  if found then
    secs := greatest(1, round((now_ms - (r.data ->> 'startTs')::bigint) / 1000.0));
    update pet_records set data = (data - 'live') || jsonb_build_object('durSec', secs, 'fine', to_char(loc, 'HH24:MI:SS')), updated = now_ms
      where id = r.id;
    return format('Fine crisi. Durata: %s min %s s. Completa i dettagli nell''app.', secs / 60, secs % 60);
  end if;
  insert into pet_records (id, user_id, dog, kind, data, updated) values (gen_random_uuid(), o, cane, 'crisi',
    jsonb_build_object('date', to_char(loc, 'YYYY-MM-DD'), 'time', to_char(loc, 'HH24:MI'), 'quante', 1, 'live', true,
      'startTs', now_ms, 'note', 'Avviata dalla schermata di blocco'), now_ms);
  return format('Crisi iniziata alle %s. Premi di nuovo quando finisce.', to_char(loc, 'HH24:MI'));
end $$;
grant execute on function public.crisi_rapida(text, text) to anon, authenticated;

-- Foto di referti e documenti
insert into storage.buckets (id, name, public) values ('documenti', 'documenti', false) on conflict (id) do nothing;
drop policy if exists "documenti di famiglia" on storage.objects;
create policy "documenti di famiglia" on storage.objects for all to authenticated
  using (bucket_id = 'documenti' and public.pet_can(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'documenti' and public.pet_can(((storage.foldername(name))[1])::uuid));
