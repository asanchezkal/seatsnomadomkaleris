import { useMemo, useState } from 'react'
import { todayString } from '../utils/dateUtils.js'

const ADMIN_PASSWORD = 'office-admin-2026'

export default function AdminPage({ desks, reservations, onAddDesk, onRemoveDesk, onClearReservations, adminUnlocked, setAdminUnlocked }) {
  const [password, setPassword] = useState('')
  const [deskInput, setDeskInput] = useState('')
  const [error, setError] = useState('')

  const upcomingReservations = useMemo(() => {
    return reservations.slice().sort((a, b) => a.date.localeCompare(b.date))
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

  if (!adminUnlocked) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Admin access</h2>
        <p className="mt-2 text-sm text-slate-600">Enter the admin password to manage desks and reservations.</p>

        <div className="mt-6 max-w-md space-y-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          />
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
