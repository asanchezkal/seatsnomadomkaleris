import { useMemo, useState } from 'react'
import { todayString } from '../utils/dateUtils.js'

const ADMIN_PASSWORD = 'office-admin-2026'

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function AdminPage({ desks, reservations, users, onAddDesk, onRemoveDesk, onClearReservations, adminUnlocked, setAdminUnlocked, onAddUser, onRemoveUser, onUpdateUserPassword }) {
  const [password, setPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [deskInput, setDeskInput] = useState('')
  const [error, setError] = useState('')
  const [userEmailInput, setUserEmailInput] = useState('')
  const [userPasswordInput, setUserPasswordInput] = useState('')
  const [showUserPassword, setShowUserPassword] = useState(false)
  const [userFormError, setUserFormError] = useState('')
  const [editingUserEmail, setEditingUserEmail] = useState(null)
  const [editPasswordInput, setEditPasswordInput] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editPasswordError, setEditPasswordError] = useState('')

  const today = todayString()
  const upcomingReservations = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [reservations])

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) {
      setAdminUnlocked(true)
      setError('')
    } else {
      setError('Invalid password. Try again.')
    }
  }

  const handleAddDesk = () => {
    const id = deskInput.trim().toUpperCase()
    if (!id) return
    onAddDesk({ id, label: id })
    setDeskInput('')
  }

  const handleAddUser = () => {
    const email = userEmailInput.trim().toLowerCase()
    const newUserPassword = userPasswordInput.trim()
    if (!email.endsWith('@kaleris.com')) {
      setUserFormError('Email must end with @kaleris.com.')
      return
    }
    if (!newUserPassword) {
      setUserFormError('Password cannot be empty.')
      return
    }
    if (users.some((u) => u.email === email)) {
      setUserFormError('A user with this email already exists.')
      return
    }
    setUserFormError('')
    onAddUser(email, newUserPassword)
    setUserEmailInput('')
    setUserPasswordInput('')
    setShowUserPassword(false)
  }

  const handleSavePassword = (email) => {
    const newPassword = editPasswordInput.trim()
    if (!newPassword) {
      setEditPasswordError('Password cannot be empty.')
      return
    }
    setEditPasswordError('')
    onUpdateUserPassword(email, newPassword)
    setEditingUserEmail(null)
    setEditPasswordInput('')
    setShowEditPassword(false)
  }

  if (!adminUnlocked) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Admin access</h2>
        <p className="mt-2 text-sm text-slate-600">Enter the admin password to manage desks and reservations.</p>

        <div className="mt-6 max-w-md space-y-4">
          <div className="relative">
            <input
              type={showAdminPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
            <button
              type="button"
              onClick={() => setShowAdminPassword((prev) => !prev)}
              tabIndex={-1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              {showAdminPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          <button
            type="button"
            onClick={handleUnlock}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Unlock admin panel
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin panel</p>
            <h2 className="text-2xl font-semibold text-slate-950">Desk and reservation controls</h2>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
            Staff-only
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Add a new desk</p>
            <div className="mt-3 flex gap-3">
              <input
                value={deskInput}
                onChange={(event) => setDeskInput(event.target.value)}
                placeholder="Desk ID e.g. E1"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
              />
              <button onClick={handleAddDesk} className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
                Add
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-slate-700">Clear reservations</p>
            <p className="mt-2 text-sm text-slate-600">Remove all desk bookings from the system.</p>
            <button onClick={onClearReservations} className="mt-4 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600">
              Clear all reservations
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-slate-950">Desk inventory</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {desks.map((desk) => (
            <div key={desk.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
              <span className="font-medium text-slate-900">{desk.label}</span>
              <button
                type="button"
                onClick={() => onRemoveDesk(desk.id)}
                className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

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
            <div className="relative sm:w-40">
              <input
                type={showUserPassword ? 'text' : 'password'}
                value={userPasswordInput}
                onChange={(e) => { setUserPasswordInput(e.target.value); setUserFormError('') }}
                placeholder="Password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowUserPassword((prev) => !prev)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showUserPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
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
                      onClick={() => { setEditingUserEmail(u.email); setEditPasswordInput(''); setEditPasswordError(''); setShowEditPassword(false) }}
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
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editPasswordInput}
                        onChange={(e) => setEditPasswordInput(e.target.value)}
                        placeholder="New password"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 pr-10 text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword((prev) => !prev)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showEditPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleSavePassword(u.email)}
                        className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingUserEmail(null); setEditPasswordError(''); setShowEditPassword(false) }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                    {editPasswordError ? <p className="mt-1 text-xs text-rose-500">{editPasswordError}</p> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Reservations</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">All bookings</h3>
          </div>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            {upcomingReservations.length}
          </span>
        </div>

        {upcomingReservations.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No reservations exist yet. Employees can reserve desks from the workspace page.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {upcomingReservations.map((reservation) => (
              <div key={reservation.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">Desk {reservation.deskId}</p>
                <p className="text-sm text-slate-600">{reservation.userName} — {reservation.date === todayString() ? 'Today' : reservation.date}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
