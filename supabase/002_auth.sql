-- ═══════════════════════════════════════════════════════════════════════════
-- 002 — Konta użytkowników: automatyczny profil + nadanie roli admin
-- Uruchomić w SQL Editor PO utworzeniu swojego konta w Authentication → Users.
-- ═══════════════════════════════════════════════════════════════════════════

-- Każde nowo utworzone konto (także przyszłe zaproszenia klientów) dostaje
-- automatycznie profil z bezpieczną domyślną rolą 'client'. Wyższe role
-- nadaje admin (w przyszłości z modułu Użytkownicy; na razie SQL-em jak niżej).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'client')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Profile dla kont utworzonych ZANIM powstał trigger:
insert into profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data->>'full_name', ''), 'client'
from auth.users
on conflict (id) do nothing;

-- ⬇⬇⬇ WPISZ TU E-MAIL SWOJEGO KONTA (rola admin) i uruchom: ⬇⬇⬇
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'j.okon@waterai.cloud');

-- Kontrola — powinno pokazać Twoje konto z rolą admin:
select u.email, p.role from profiles p join auth.users u on u.id = p.id;
