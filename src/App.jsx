import { useEffect, useMemo, useState } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import useLocalStorage from './hooks/useLocalStorage.js'
import { loadDesks, loadReservations, saveDesks, saveReservations, setCurrentUser, removeCurrentUser } from './services/storage.js'
import { getReservationsForDate, createReservation as localCreateReservation, cancelReservation as localCancelReservation, canReserve } from './services/reservationService.js'
import { fetchReservations, ensureInitialDesks, createDesk as dbCreateDesk, removeDesk as dbRemoveDesk, createReservation as dbCreateReservation, cancelReservation as dbCancelReservation, clearAllReservations, fetchUsers, createUser as dbCreateUser, deleteUser as dbDeleteUser, updateUserPassword as dbUpdateUserPassword, validateUser } from './services/database.js'
import { isSupabaseEnabled } from './services/supabaseClient.js'
import { initialDesks } from './data/mockData.js'
import { todayString } from './utils/dateUtils.js'
import { deriveNameFromEmail } from './utils/userUtils.js'
import { subscribeToPushNotifications } from './services/pushService.js'

function App() {
  const [user, setUser] = useLocalStorage('office-seat-reservation-user', null)
  const [desks, setDesks] = useState([])
  const [reservations, setReservations] = useState([])
  const [selectedDate, setSelectedDate] = useLocalStorage('office-seat-reservation-date', todayString())
  const [page, setPage] = useState('home')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [backendError, setBackendError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [users, setUsers] = useState([])
  const supabaseEnabled = isSupabaseEnabled

  const formatBackendError = (prefix, error) => {
    if (!error) return prefix
    return `${prefix} ${error.message || JSON.stringify(error)}`
  }

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
        setBackendError('')
        const { data: desksFromDb, error: desksError } = await ensureInitialDesks()
        if (desksError || desksFromDb === null) {
          setBackendError(formatBackendError('Failed to load backend desk configuration. Check Supabase permissions and table setup.', desksError))
          return
        }

        setDesks(desksFromDb)

        const { data: reservationsFromDb, error: reservationsError } = await fetchReservations()
        if (reservationsError) {
          setBackendError(formatBackendError('Failed to load backend reservations. Check Supabase permissions and table setup.', reservationsError))
          return
        }

        setReservations(reservationsFromDb.map(normalizeReservation))

        const { data: usersFromDb, error: usersError } = await fetchUsers()
        if (usersError) {
          setBackendError(formatBackendError('Failed to load users.', usersError))
          return
        }
        setUsers(usersFromDb)
        return
      }

      setDesks(loadDesks() || initialDesks)
      setReservations(loadReservations())
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

  const handleLogin = async (email, password) => {
    if (supabaseEnabled) {
      const { data: userRow, error } = await validateUser(email, password)
      if (error) return 'Login failed. Please try again.'
      if (!userRow) return 'Email or password is incorrect.'
      const profile = { id: email, name: deriveNameFromEmail(email), email }
      setUser(profile)
      setCurrentUser(profile)
      setPage('home')
      if (email === 'sevdapinar.coskun@kaleris.com') {
        subscribeToPushNotifications(email).catch(console.error)
      }
      return null
    }
    if (password !== '1234') return 'Email or password is incorrect.'
    const profile = { id: email, name: deriveNameFromEmail(email), email }
    setUser(profile)
    setCurrentUser(profile)
    setPage('home')
    return null
  }

  const handleLogout = () => {
    removeCurrentUser()
    setUser(null)
    setAdminUnlocked(false)
    setPage('home')
  }

  const handleReservation = async (deskId) => {
    if (!user || !canReserve(reservations, selectedDate, deskId, user.id) || isProcessing) {
      return
    }
    setIsProcessing(true)
    if (supabaseEnabled) {
      setBackendError('')
      const { data: newReservation, error } = await dbCreateReservation(deskId, selectedDate, user)
      if (error) {
        setBackendError(formatBackendError('Failed to create reservation. Check Supabase permissions and table configuration.', error))
        setIsProcessing(false)
        return
      }
      // Refrescar reservas desde backend tras reservar
      const { data: reservationsFromDb, error: reservationsError } = await fetchReservations()
      if (reservationsError) {
        setBackendError(formatBackendError('Failed to reload reservations after booking.', reservationsError))
      } else {
        setReservations(reservationsFromDb.map(normalizeReservation))
      }
      setIsProcessing(false)
      return
    }
    const next = localCreateReservation(reservations, deskId, selectedDate, user)
    setReservations(next)
    setIsProcessing(false)
  }

  const handleCancel = async (reservationId) => {
    if (supabaseEnabled) {
      setBackendError('')
      const { error } = await dbCancelReservation(reservationId, user.id)
      if (error) {
        setBackendError(formatBackendError('Failed to cancel reservation. Check Supabase permissions and table configuration.', error))
        return
      }
    }
    setReservations(localCancelReservation(reservations, reservationId, user.id))
  }

  const handleAddDesk = async (desk) => {
    if (supabaseEnabled) {
      setBackendError('')
      const { data: created, error } = await dbCreateDesk(desk)
      if (error) {
        setBackendError(formatBackendError('Failed to add desk. Check Supabase permissions and table configuration.', error))
        return
      }
      if (created) {
        setDesks((prev) => [...prev, created])
      }
      return
    }

    setDesks((prev) => [...prev, desk])
  }

  const handleRemoveDesk = async (deskId) => {
    if (supabaseEnabled) {
      setBackendError('')
      const { error } = await dbRemoveDesk(deskId)
      if (error) {
        setBackendError(formatBackendError('Failed to remove desk. Check Supabase permissions and table configuration.', error))
        return
      }
    }
    setDesks((prev) => prev.filter((desk) => desk.id !== deskId))
    setReservations((prev) => prev.filter((reservation) => reservation.deskId !== deskId))
  }

  const handleClearReservations = async () => {
    if (supabaseEnabled) {
      setBackendError('')
      const { error } = await clearAllReservations()
      if (error) {
        setBackendError(formatBackendError('Failed to clear reservations. Check Supabase permissions and table configuration.', error))
        return
      }
    }
    setReservations([])
  }

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
            {isProcessing ? (
              <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 shadow-sm">
                Processing reservation...
              </div>
            ) : null}
            {backendError ? (
              <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
                {backendError}
              </div>
            ) : null}
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
