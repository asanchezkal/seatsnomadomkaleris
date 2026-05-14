import { useEffect, useMemo, useState } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import useLocalStorage from './hooks/useLocalStorage.js'
import { loadDesks, loadReservations, saveDesks, saveReservations, setCurrentUser, removeCurrentUser } from './services/storage.js'
import { getReservationsForDate, createReservation as localCreateReservation, cancelReservation as localCancelReservation, canReserve } from './services/reservationService.js'
import { fetchReservations, ensureInitialDesks, createDesk as dbCreateDesk, removeDesk as dbRemoveDesk, createReservation as dbCreateReservation, cancelReservation as dbCancelReservation, clearAllReservations } from './services/database.js'
import { isSupabaseEnabled } from './services/supabaseClient.js'
import { initialDesks } from './data/mockData.js'
import { todayString } from './utils/dateUtils.js'

function App() {
  const [user, setUser] = useLocalStorage('office-seat-reservation-user', null)
  const [desks, setDesks] = useState([])
  const [reservations, setReservations] = useState([])
  const [selectedDate, setSelectedDate] = useLocalStorage('office-seat-reservation-date', todayString())
  const [page, setPage] = useState('home')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const supabaseEnabled = isSupabaseEnabled

  const normalizeReservation = (reservation) => ({
    id: reservation.id,
    deskId: reservation.desk_id || reservation.deskId,
    date: reservation.date,
    userId: reservation.user_id || reservation.userId,
    userName: reservation.user_name || reservation.userName,
    userEmail: reservation.user_email || reservation.userEmail,
  })

  useEffect(() => {
    async function loadData() {
      if (supabaseEnabled) {
        const desksFromDb = await ensureInitialDesks()
        setDesks(desksFromDb)
        const reservationsFromDb = await fetchReservations()
        setReservations(reservationsFromDb.map(normalizeReservation))
      } else {
        setDesks(loadDesks() || initialDesks)
        setReservations(loadReservations())
      }
    }

    loadData()
  }, [supabaseEnabled])

  useEffect(() => {
    if (!supabaseEnabled && desks.length) {
      saveDesks(desks)
    }
  }, [desks, supabaseEnabled])

  useEffect(() => {
    if (!supabaseEnabled) {
      saveReservations(reservations)
    }
  }, [reservations, supabaseEnabled])

  const dateReservations = useMemo(
    () => getReservationsForDate(reservations, selectedDate),
    [reservations, selectedDate],
  )
  const backendStatus = supabaseEnabled
    ? 'Shared backend active — reservations are stored centrally for all browsers.'
    : 'Local-only mode: Supabase is not configured, so changes are stored only in this browser.'

  const handleLogin = (profile) => {
    setUser(profile)
    setCurrentUser(profile)
    setPage('home')
  }

  const handleLogout = () => {
    removeCurrentUser()
    setUser(null)
    setAdminUnlocked(false)
    setPage('home')
  }

  const handleReservation = async (deskId) => {
    if (!user || !canReserve(reservations, selectedDate, deskId, user.id)) {
      return
    }

    if (supabaseEnabled) {
      const newReservation = await dbCreateReservation(deskId, selectedDate, user)
      if (newReservation) {
        setReservations((prev) => [...prev, normalizeReservation(newReservation)])
      }
      return
    }

    const next = localCreateReservation(reservations, deskId, selectedDate, user)
    setReservations(next)
  }

  const handleCancel = async (reservationId) => {
    if (supabaseEnabled) {
      await dbCancelReservation(reservationId, user.id)
    }
    setReservations(localCancelReservation(reservations, reservationId, user.id))
  }

  const handleAddDesk = async (desk) => {
    if (supabaseEnabled) {
      const created = await dbCreateDesk(desk)
      if (created) {
        setDesks((prev) => [...prev, created])
      }
      return
    }

    setDesks((prev) => [...prev, desk])
  }

  const handleRemoveDesk = async (deskId) => {
    if (supabaseEnabled) {
      await dbRemoveDesk(deskId)
    }
    setDesks((prev) => prev.filter((desk) => desk.id !== deskId))
    setReservations((prev) => prev.filter((reservation) => reservation.deskId !== deskId))
  }

  const handleClearReservations = async () => {
    if (supabaseEnabled) {
      await clearAllReservations()
    }
    setReservations([])
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Office reservations</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Desk booking dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Reserve a seat, manage your upcoming desk bookings, and keep your office schedule clear.
            </p>
            <p className="mt-2 rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm">
              {backendStatus}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => setPage('home')}
            >
              Workspace
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => setPage('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {page === 'admin' ? (
          <AdminPage
            user={user}
            desks={desks}
            reservations={reservations}
            onAddDesk={handleAddDesk}
            onRemoveDesk={handleRemoveDesk}
            onClearReservations={handleClearReservations}
            adminUnlocked={adminUnlocked}
            setAdminUnlocked={setAdminUnlocked}
          />
        ) : (
          <HomePage
            user={user}
            desks={desks}
            reservations={reservations}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onReserve={handleReservation}
            onCancel={handleCancel}
            dateReservations={dateReservations}
          />
        )}
      </div>
    </div>
  )
}

export default App
