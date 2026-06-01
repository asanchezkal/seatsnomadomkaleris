# User Management Design

**Date:** 2026-06-01
**Branch:** main (original Vercel + Supabase app)
**Status:** Approved

## Summary

Add database-driven user management to the office seat reservation app. The admin can add, remove, and change passwords for users from the admin panel. Login validates email + password against a Supabase `users` table. The existing localStorage fallback (dev mode) is preserved.

---

## 1. Architecture

A `users` table is added to Supabase. Two parts of the app are wired to it:

- **Login** — validates email + password against the `users` table (Supabase mode) or falls back to any `@kaleris.com` email + password `1234` (localStorage mode)
- **Admin panel** — new "User management" section: add, remove, and change passwords for users

The dual-mode pattern from `App.jsx` is followed exactly — each operation checks `isSupabaseEnabled` and branches. No new architectural concepts.

---

## 2. Database

New table created manually in the Supabase dashboard:

```sql
create table users (
  email    text primary key,
  password text not null
);
```

- `email` — primary key, must end with `@kaleris.com`
- `password` — plain text, no length restriction

RLS left disabled (same as `desks` and `reservations` tables). The app accesses Supabase directly with the anon key.

User display name is derived from email at login time: `jane.doe@kaleris.com` → `Jane Doe`. No extra column needed.

---

## 3. Login Flow

### `LoginPage.jsx` changes
- "Username or email" field → **Email** (always `@kaleris.com`)
- "Password" field stays as **Password**, no length restriction
- "Example accounts" panel removed
- Login is async — calls `onLogin(email, password)` passed from `App.jsx`, which returns `null` on success or an error string on failure

### Login logic in `App.jsx`
**Supabase mode:**
1. Call `validateUser(email, password)` — queries `users` table for matching row
2. Found → build profile `{ id: email, name: derivedName(email), email }`, set user, navigate to home
3. Not found → return `'Email or password is incorrect.'`

**localStorage mode:** Any `@kaleris.com` email + password `1234` succeeds (unchanged behavior).

### Name derivation
```
jane.doe@kaleris.com → split('@')[0] → 'jane.doe' → split('.') → ['jane','doe'] → capitalize each → 'Jane Doe'
```

---

## 4. Admin User Management UI

New section in `AdminPage.jsx`, placed between the existing controls section and the reservations section.

### Add user form
- Email input + Password input + **Add** button
- Inline validation: email must end `@kaleris.com`, password must not be empty, duplicate email shows error
- Same visual style as the "Add a new desk" form

### User list
- One card per user: shows email and password
- **Remove** button — deletes user immediately
- **Change password** button — reveals inline input + **Save** button on that card (no modal)

### Props received from `App.jsx`
- `users` — array of `{ email, password }`
- `onAddUser(email, password)`
- `onRemoveUser(email)`
- `onUpdateUserPassword(email, newPassword)`

---

## 5. State and Data Flow (`App.jsx`)

### New state
```js
const [users, setUsers] = useState([])
```
Loaded on mount alongside desks and reservations (Supabase mode only; localStorage mode has no user list state).

### New functions in `database.js`
| Function | Description |
|---|---|
| `fetchUsers()` | `select * from users` |
| `createUser(email, password)` | Insert new row |
| `deleteUser(email)` | Delete by email |
| `updateUserPassword(email, newPassword)` | Update password for email |
| `validateUser(email, password)` | Select where email+password match; returns row or null |

### New handlers in `App.jsx`
| Handler | Behavior |
|---|---|
| `handleLogin(email, password)` | Supabase: calls `validateUser`; localStorage: checks `@kaleris.com` + `1234`; returns error string or null |
| `handleAddUser(email, password)` | Calls `createUser`, updates `users` state |
| `handleRemoveUser(email)` | Calls `deleteUser`, updates `users` state |
| `handleUpdateUserPassword(email, newPassword)` | Calls `updateUserPassword`, updates `users` state |

---

## 6. Files Changed

| File | Change |
|---|---|
| `src/pages/LoginPage.jsx` | Simplify to email + password, make login async via prop, remove example accounts panel |
| `src/pages/AdminPage.jsx` | Add user management section with add/remove/edit-password UI |
| `src/services/database.js` | Add `fetchUsers`, `createUser`, `deleteUser`, `updateUserPassword`, `validateUser` |
| `src/App.jsx` | Add `users` state, load on mount, add user handlers, update `handleLogin` |

No new files. No changes to `storage.js`, `reservationService.js`, or any other service.
