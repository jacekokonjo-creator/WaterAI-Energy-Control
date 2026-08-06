# Patch 007 — wiele ról: zmiany po stronie frontendu

Uzupełnienie do `migration_007_multi_roles.sql`. Kolejność: **najpierw SQL, potem JS** —
migracja jest zgodna wstecz, więc stary frontend działa na nowej bazie.

---

## 1. `index.html` — stan sesji

### 1a. Deklaracje (ok. linia 986)

```js
// BYŁO
let currentRole = "admin";
let realRole    = "admin";

// JEST
let currentRole = "admin";          // rola AKTYWNA w widoku (przełącznik)
let realRole    = "admin";          // rola główna = realRoles[0] (zgodność wstecz)
let realRoles   = ["admin"];        // WSZYSTKIE role konta — źródło uprawnień

function hasRole(r)      { return realRoles.includes(r); }
function hasAnyRole(...r){ return r.some(x => realRoles.includes(x)); }
```

### 1b. Wczytanie profilu (ok. linia 1122)

```js
// BYŁO
realRole    = profile.role;
currentRole = profile.role;

// JEST
realRoles   = (profile.roles && profile.roles.length) ? profile.roles : [profile.role || 'client'];
realRole    = realRoles[0];
currentRole = realRoles[0];
```

Zapytanie po profil musi dociągnąć kolumnę — dopisz `roles` do `select(...)`.

### 1c. Przełącznik roli (ok. linia 1064)

Panel jest dziś widoczny tylko dla admina. Przy wielu rolach zyskuje drugie,
naturalne zastosowanie: **przełączanie własnego kontekstu pracy**.

```js
// BYŁO
if (rolePanel) rolePanel.style.display = realRole === "admin" ? "block" : "none";

// JEST
if (rolePanel) rolePanel.style.display = (realRole === "admin" || realRoles.length > 1) ? "block" : "none";
// lista opcji: admin → wszystkie role (podgląd), pozostali → wyłącznie realRoles
```

> **Uwaga bezpieczeństwa.** `currentRole` steruje wyłącznie WYGLĄDEM.
> Uprawnienia egzekwuje RLS na podstawie `roles` w bazie — przełącznik nie
> może niczego odblokować i nie wolno używać `currentRole` do decyzji o zapisie.

---

## 2. `js/modules/users.js`

### 2a. `_mapProfile`

```js
const roles = (Array.isArray(p.roles) && p.roles.length) ? p.roles : [p.role || 'client'];
return {
  // ...
  roles,
  role: roles[0],        // rola główna — zgodność ze starym kodem
  // ...
};
```

Dopisz `roles` do `select` w `load()`.

### 2b. `findByRole`

```js
// BYŁO
findByRole(role) { return this.getAll().filter(u => u.role === role); }

// JEST — konto z rolą wśród wielu ma się znaleźć w wyniku
findByRole(role) { return this.getAll().filter(u => (u.roles || [u.role]).includes(role)); }
```

### 2c. `createAccount` / `updateProfile`

`opts.role` → `opts.roles` (tablica). W wierszu do bazy:

```js
const row = { id: user.id, full_name: opts.fullName, roles: opts.roles, data: { email: opts.email } };
if (opts.roles.includes('client') && opts.clientLegacyId) { row.client_id = /* ... */; }
```

W `updateProfile` warunek `patch.role === 'client'` zamień na
`patch.roles.includes('client')`; `client_id` czyść, gdy `client` zniknęło z tablicy.

### 2d. `_usrCanManage`

```js
function _usrCanManage() { return hasRole('admin') || hasRole('backOffice'); }
function _usrIsAdmin()   { return hasRole('admin'); }
```

### 2e. UI

* formularz konta: pojedynczy `<select>` ról → **checkboxy** (5 pozycji z `ROLES`);
* karta użytkownika: pętla po `u.roles` — po jednym badge'u na rolę
  (`ROLES[r].icon` + `label` + kolory już są);
* filtr `usersActiveRole`: warunek `u.role === usersActiveRole`
  → `(u.roles || []).includes(usersActiveRole)`;
* walidacja przy zapisie: min. 1 rola; `client` nie łączy się z wewnętrznymi
  (baza i tak odrzuci przez `chk_roles_client_exclusive`, ale komunikat
  z formularza jest czytelniejszy niż błąd RLS);
* Back Office nie widzi checkboxa `admin` (blokada eskalacji jest w RLS,
  ale nie pokazuj przycisku, który zawsze zwróci błąd).

---

## 3. Pozostałe wystąpienia

```
js/modules/app-v2.js   — currentRole==='energyAnalyst', currentRole==='admin'
js/modules/readings.js — 2 wystąpienia
```

Jeśli sterują **widocznością** — zostają na `currentRole`.
Jeśli sterują **dostępem** — na `hasRole(...)`.

---

## 4. Do rozstrzygnięcia przed wdrożeniem

1. **Czy Back Office może nadać sobie `energyAnalyst`?** Dziś RLS blokuje
   wyłącznie `admin`. Jeśli analityk ma być rolą kontrolowaną (a tak wynika
   z tego, że to on zatwierdza pomiary i wykonuje analizy), dopisz go do
   strażnika w `p_profiles_bo_*`.
2. **Kto ustala rolę główną**, gdy ktoś ma ich kilka? Dziś: pierwsza w tablicy,
   czyli kolejność zaznaczania w formularzu. Alternatywa: stała hierarchia
   `admin > backOffice > energyAnalyst > salesRepresentative > client`.
3. **`created_by` przy rolach mieszanych.** Polityki typu
   `can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid())`
   działają poprawnie (suma), ale konto `backOffice + energyAnalyst` dostanie
   prawo kasowania cudzych rekordów z gałęzi `backOffice`. Sprawdź, czy to
   pożądane.

---

## 5. Kolejność wdrożenia i wycofanie

1. Backup bazy.
2. `migration_007_multi_roles.sql` w SQL Editor.
3. Weryfikacja z sekcji 7 migracji — zapytanie (b) **musi** zwrócić 0 wierszy.
4. Deploy frontendu.

**Rollback:** kolumna `role` jest cały czas utrzymywana przez trigger, więc
powrót do starych polityk (`app_role() = '...'`) nie wymaga migracji danych —
wystarczy odtworzyć polityki ze `schema.sql` / `003` / `006`.
