# User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Supabase `users` table, admin UI for managing users (add/remove/change password), and database-driven login replacing the hardcoded password.

**Architecture:** A `users` table (email, password) is added to Supabase. App.jsx validates login against it in Supabase mode; in localStorage/dev mode any `@kaleris.com` email + password `1234` still works. App.jsx owns all user state and handlers and passes them as props to LoginPage and AdminPage.

**Tech Stack:** React 18, Vite 5, Supabase JS v2, Tailwind CSS 3, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `package.json` | Modify | Add vitest dev dependency + test script |
| `vite.config.js` | Modify | Add vitest test environment config |
| `src/utils/userUtils.js` | Create | `deriveNameFromEmail(email)` helper |
| `src/utils/userUtils.test.js` | Create | Vitest unit tests for `deriveNameFromEmail` |
| `src/services/database.js` | Modify | Add `fetchUsers`, `createUser`, `deleteUser`, `updateUserPassword`, `validateUser` |
| `src/App.jsx` | Modify | Add users state, user handlers, async handleLogin |
| `src/pages/LoginPage.jsx` | Modify | Email-only field, async login via prop, remove example accounts panel |
| `src/pages/AdminPage.jsx` | Modify | Add user management section (add/remove/change password) |

---

### Task 1: Set up Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] **Step 1: Install vitest**

```bash
npm install --save-dev vitest
```

- [ ] **Step 2: Add test script to `package.json`**

In `package.json`, update `scripts` to:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest"
},
```

- [ ] **Step 3: Add test environment to `vite.config.js`**

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
  },
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Verify setup runs**

```bash
npm test -- --run
```

Expected: "No test files found, exiting with code 0" — confirms Vitest is configured.

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.js package-lock.json
git commit -m "chore: add vitest test runner"
```

---

### Task 2: Add `deriveNameFromEmail` utility

**Files:**
- Create: `src/utils/userUtils.js`
- Create: `src/utils/userUtils.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/utils/userUtils.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { deriveNameFromEmail } from './userUtils.js'

describe('deriveNameFromEmail', () => {
  it('converts jane.doe@kaleris.com to Jane Doe', () => {
    expect(deriveNameFromEmail('jane.doe@kaleris.com')).toBe('Jane Doe')
  })

  it('converts mark.tan@kaleris.com to Mark Tan', () => {
    expect(deriveNameFromEmail('mark.tan@kaleris.com')).toBe('Mark Tan')
  })

  it('handles single-part local name', () => {
    expect(deriveNameFromEmail('alice@kaleris.com')).toBe('Alice')
  })

  it('handles three-part local name', () => {
    expect(deriveNameFromEmail('mary.ann.jones@kaleris.com')).toBe('Mary Ann Jones')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- --run
```

Expected: FAIL — "Cannot find module './userUtils.js'"

- [ ] **Step 3: Implement `deriveNameFromEmail`**

Create `src/utils/userUtils.js`:

```js
export function deriveNameFromEmail(email) {
  const localPart = email.split('@')[0]
  return localPart
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
```

- [ ] **Step 4: Run tests to confirm passing**

```bash
npm test -- --run
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/userUtils.js src/utils/userUtils.test.js
git commit -m "feat: add deriveNameFromEmail utility"
```

---

### Task 3: Create `users` table in Supabase

**This is a manual database step — no code changes.**

- [ ] **Step 1: Open Supabase dashboard → SQL editor**

Run this SQL:

```sql
create table users (
  email    text primary key,
  password text not null
);
```

- [ ] **Step 2: Verify the table was created**

In the Supabase Table Editor, confirm the `users` table appears with columns `email` (text, primary key) and `password` (text, not null).

- [ ] **Step 3: Insert and delete a test row to confirm write access**

```sql
insert into users (email, password) values ('test.user@kaleris.com', 'testpass');
delete from users where email = 'test.user@kaleris.com';
```

---

### Task 4: Add user database functions to `database.js`

**Files:**
- Modify: `src/services/database.js`

- [ ] **Step 1: Add `USER_TABLE` constant and five functions**

Open `src/services/database.js`. After the line `const RESERVATION_TABLE = 'reservations'`, add:

```js
const USER_TABLE = 'users'
```

Then, after the existing `clearAllReservations` function, add:

```js
export async function fetchUsers() {
  const { data, error } = await supabase.from(USER_TABLE).select('*').order('email', { ascending: true })
  logSupabaseError('Error fetching users', error)
  return { data: data || [], error }
}

export async function createUser(email, password) {
  const { data, error } = await supabase.from(USER_TABLE).insert({ email, password }).select()
  logSupabaseError('Error creating user', error)
  return { data: data?.[0] || null, error }
}

export async function deleteUser(email) {
  const { error } = await supabase.from(USER_TABLE).delete().eq('email', email)
  logSupabaseError('Error deleting user', error)
  return { error }
}

export async function updateUserPassword(email, newPassword) {
  const { error } = await supabase.from(USER_TABLE).update({ password: newPassword }).eq('email', email)
  logSupabaseError('Error updating user password', error)
  return { error }
}

export async function validateUser(email, password) {
  const { data, error } = await supabase
    .from(USER_TABLE)
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .maybeSingle()
  logSupabaseError('Error validating user', error)
  return { data: data || null, error }
}
```

Note: `.maybeSingle()` returns `null` (not an error) when no matching row is found — correct for a login check.

- [ ] **Step 2: Commit**

```bash
git add src/services/database.js
git commit -m "feat: add user CRUD and validateUser to database.js"
```

---

### Task 5: Update `App.jsx` — users state, handlers, async login

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update the `database.js` import to include the new functions**

Replace the existing `database.js` import line with:

```js
import { fetchReservations, ensureInitialDesks, createDesk as dbCreateDesk, removeDesk as dbRemoveDesk, createReservation as dbCreateReservation, cancelReservation as dbCancelReservation, clearAllReservations, fetchUsers, createUser as dbCreateUser, deleteUser as dbDeleteUser, updateUserPassword as dbUpdateUserPassword, validateUser } from './services/database.js'
```

- [ ] **Step 2: Add `deriveNameFromEmail` import**

After the existing imports, add:

```js
import { deriveNameFromEmail } from './utils/userUtils.js'
```

- [ ] **Step 3: Add `users` state**

Inside the `App` function body, after the existing state declarations, add:

```js
const [users, setUsers] = useState([])
```

- [ ] **Step 4: Load users in the `loadData` effect**

Inside the `loadData` async function (in the `useEffect`), after the `setReservations(reservationsFromDb.map(normalizeReservation))` call and before the final `return`, add:

```js
const { data: usersFromDb, error: usersError } = await fetchUsers()
if (usersError) {
  setBackendError(formatBackendError('Failed to load users.', usersError))
  return
}
setUsers(usersFromDb)
```

- [ ] **Step 5: Replace `handleLogin` with an async version**

Replace the existing `handleLogin` function with:

```js
const handleLogin = async (email, password) => {
  if (supabaseEnabled) {
    const { data: userRow, error } = await validateUser(email, password)
    if (error) return 'Login failed. Please try again.'
    if (!userRow) return 'Email or password is incorrect.'
    const profile = { id: email, name: deriveNameFromEmail(email), email }
    setUser(profile)
    setCurrentUser(profile)
    setPage('home')
    return null
  }
  if (password !== '1234') return 'Email or password is incorrect.'
  const profile = { id: email, name: deriveNameFromEmail(email), email }
  setUser(profile)
  setCurrentUser(profile)
  setPage('home')
  return null
}
```

- [ ] **Step 6: Add user management handlers**

After `handleClearReservations`, add:

```js
const handleAddUser = async (email, password) => {
  if (!supabaseEnabled) return
  setBackendError('')
  const { error } = await dbCreateUser(email, password)
  if (error) {
    setBackendError(formatBackendError('Failed to add user.', error))
    return
  }
  setUsers((prev) => [...prev, { email, password }].sort((a, b) => a.email.localeCompare(b.email)))
}

const handleRemoveUser = async (email) => {
  if (!supabaseEnabled) return
  setBackendError('')
  const { error } = await dbDeleteUser(email)
  if (error) {
    setBackendError(formatBackendError('Failed to remove user.', error))
    return
  }
  setUsers((prev) => prev.filter((u) => u.email !== email))
}

const handleUpdateUserPassword = async (email, newPassword) => {
  if (!supabaseEnabled) return
  setBackendError('')
  const { error } = await dbUpdateUserPassword(email, newPassword)
  if (error) {
    setBackendError(formatBackendError('Failed to update password.', error))
    return
  }
  setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, password: newPassword } : u)))
}
```

- [ ] **Step 7: Pass new props to `AdminPage`**

Find the `<AdminPage ... />` JSX and update it to include the user props:

```jsx
<AdminPage
  user={user}
  desks={desks}
  reservations={reservations}
  users={users}
  onAddDesk={handleAddDesk}
  onRemoveDesk={handleRemoveDesk}
  onClearReservations={handleClearReservations}
  onAddUser={handleAddUser}
  onRemoveUser={handleRemoveUser}
  onUpdateUserPassword={handleUpdateUserPassword}
  adminUnlocked={adminUnlocked}
  setAdminUnlocked={setAdminUnlocked}
/>
```

The `<LoginPage onLogin={handleLogin} />` line does not change — the prop name is the same; only the function signature has changed.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add users state, handlers, and async login to App"
```

---

### Task 6: Update `LoginPage.jsx`

**Files:**
- Modify: `src/pages/LoginPage.jsx`

`LoginPage` no longer builds a user profile — it calls `onLogin(email, password)` (which is async and returns an error string or `null`) and shows the error if non-null.

- [ ] **Step 1: Replace the entire file**

Replace `src/pages/LoginPage.jsx` with:

```jsx
import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setError('Enter your email to continue.')
      return
    }
    if (!trimmedEmail.endsWith('@kaleris.com')) {
      setError('Email must end with @kaleris.com.')
      return
    }
    if (!password) {
      setError('Enter your password to continue.')
      return
    }
    setLoading(true)
    const errorMsg = await onLogin(trimmedEmail, password)
    setLoading(false)
    if (errorMsg) setError(errorMsg)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Internal tool</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Office Desk Reservations</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in with your Kaleris email and password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError('')
              }}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              placeholder="jane.doe@kaleris.com"
              autoComplete="email"
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Start the dev server and verify manually**

```bash
npm run dev
```

Open http://localhost:4173. Verify:
- Only Email + Password fields, no "Example accounts" panel
- Empty email submit → "Enter your email to continue."
- Non-kaleris email → "Email must end with @kaleris.com."
- Empty password → "Enter your password to continue."
- In localStorage mode (no Supabase env vars): any `@kaleris.com` email + `1234` → logs in and shows the home page
- In localStorage mode: wrong password → "Email or password is incorrect."
- Button shows "Signing in…" during the async call

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.jsx
git commit -m "feat: update LoginPage to email + password with async validation"
```

---

### Task 7: Update `AdminPage.jsx` — user management section

**Files:**
- Modify: `src/pages/AdminPage.jsx`

- [ ] **Step 1: Update the function signature to accept user props**

Replace the existing `export default function AdminPage(...)` line with:

```js
export default function AdminPage({ desks, reservations, users, onAddDesk, onRemoveDesk, onClearReservations, adminUnlocked, setAdminUnlocked, onAddUser, onRemoveUser, onUpdateUserPassword }) {
```

- [ ] **Step 2: Add user management state variables**

After the existing state declarations (`password`, `deskInput`, `error`), add:

```js
const [userEmailInput, setUserEmailInput] = useState('')
const [userPasswordInput, setUserPasswordInput] = useState('')
const [userFormError, setUserFormError] = useState('')
const [editingUserEmail, setEditingUserEmail] = useState(null)
const [editPasswordInput, setEditPasswordInput] = useState('')
```

- [ ] **Step 3: Add `handleAddUser` and `handleSavePassword` local handlers**

After the existing `handleAddDesk` function, add:

```js
const handleAddUser = () => {
  const email = userEmailInput.trim().toLowerCase()
  const password = userPasswordInput.trim()
  if (!email.endsWith('@kaleris.com')) {
    setUserFormError('Email must end with @kaleris.com.')
    return
  }
  if (!password) {
    setUserFormError('Password cannot be empty.')
    return
  }
  if (users.some((u) => u.email === email)) {
    setUserFormError('A user with this email already exists.')
    return
  }
  setUserFormError('')
  onAddUser(email, password)
  setUserEmailInput('')
  setUserPasswordInput('')
}

const handleSavePassword = (email) => {
  const newPassword = editPasswordInput.trim()
  if (!newPassword) return
  onUpdateUserPassword(email, newPassword)
  setEditingUserEmail(null)
  setEditPasswordInput('')
}
```

- [ ] **Step 4: Add the user management section to the JSX**

In the unlocked admin JSX, add this section between the closing `</section>` of the desk controls grid and the opening `<section>` of the upcoming reservations:

```jsx
<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
  <h3 className="text-lg font-semibold text-slate-950">User management</h3>

  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-sm font-medium text-slate-700">Add a user</p>
    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
      <input
        value={userEmailInput}
        onChange={(e) => { setUserEmailInput(e.target.value); setUserFormError('') }}
        placeholder="jane.doe@kaleris.com"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
      />
      <input
        value={userPasswordInput}
        onChange={(e) => { setUserPasswordInput(e.target.value); setUserFormError('') }}
        placeholder="Password"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none sm:w-40"
      />
      <button
        type="button"
        onClick={handleAddUser}
        className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        Add
      </button>
    </div>
    {userFormError ? <p className="mt-2 text-sm text-rose-500">{userFormError}</p> : null}
  </div>

  {users.length === 0 ? (
    <p className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      No users yet. Add one above.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {users.map((u) => (
        <div key={u.email} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">{u.email}</p>
              <p className="text-sm text-slate-500">Password: {u.password}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setEditingUserEmail(u.email); setEditPasswordInput('') }}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Change password
              </button>
              <button
                type="button"
                onClick={() => onRemoveUser(u.email)}
                className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
              >
                Remove
              </button>
            </div>
          </div>
          {editingUserEmail === u.email ? (
            <div className="mt-3 flex gap-3">
              <input
                value={editPasswordInput}
                onChange={(e) => setEditPasswordInput(e.target.value)}
                placeholder="New password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={() => handleSavePassword(u.email)}
                className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingUserEmail(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )}
</section>
```

- [ ] **Step 5: Verify end-to-end in the browser (Supabase mode)**

With Supabase configured (`.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`):

1. Log in as an existing Supabase user
2. Go to Admin → unlock with `office-admin-2026`
3. Scroll to "User management" section
4. Add `new.user@kaleris.com` with password `hello123` → appears in list
5. Click "Change password" on that user → enter `changed456` → Save → password updates in list
6. Click Remove → user disappears from list
7. Try to add the same email twice → see "A user with this email already exists."
8. Log out → log in as `new.user@kaleris.com` / `hello123` — should succeed
9. (After removing in step 6, same login attempt should show "Email or password is incorrect.")

- [ ] **Step 6: Commit**

```bash
git add src/pages/AdminPage.jsx
git commit -m "feat: add user management section to AdminPage"
```
