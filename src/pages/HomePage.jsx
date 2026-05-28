import { useMemo, useState, useRef, useEffect } from 'react'
import DeskCard from '../components/DeskCard.jsx'
import DatePicker from '../components/DatePicker.jsx'
import ReservationSummary from '../components/ReservationSummary.jsx'
import DeskFilter from '../components/DeskFilter.jsx'
import { getReservationByDesk, getUserReservations } from '../services/reservationService.js'

const seatMapImage = new URL('../../media/setmapdistribution.png', import.meta.url).href

export default function HomePage({ user, desks, reservations, selectedDate, onDateChange, onReserve, onCancel, dateReservations }) {
  const [search, setSearch] = useState('')

  const filteredDesks = useMemo(() => {
    if (!search) return desks
    return desks.filter((desk) => desk.label.toLowerCase().includes(search.toLowerCase()))
  }, [desks, search])

  const myReservations = useMemo(() => getUserReservations(reservations, user.id), [reservations, user.id])
  const hasBookingToday = useMemo(
    () => dateReservations.some((reservation) => reservation.userId === user.id),
    [dateReservations, user.id],
  )
  const [showMapPreview, setShowMapPreview] = useState(false)
  const [showMapOverlay, setShowMapOverlay] = useState(false)
  const mapOverlayRef = useRef(null)

  // Cerrar overlay al tocar fuera en móvil
  useEffect(() => {
    if (!showMapOverlay) return
    function handleClick(e) {
      if (mapOverlayRef.current && !mapOverlayRef.current.contains(e.target)) {
        setShowMapOverlay(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [showMapOverlay])
  const isKalerisUser = user?.email?.toLowerCase().endsWith('@kaleris.com')

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Today</p>
              <div
                className="mt-2 inline-flex items-center gap-2"
                onMouseEnter={() => window.innerWidth >= 768 && setShowMapPreview(true)}
                onMouseLeave={() => window.innerWidth >= 768 && setShowMapPreview(false)}
                onClick={() => setShowMapOverlay((v) => !v)}
                style={{ cursor: 'pointer' }}
              >
                <h2 className="text-2xl font-semibold text-slate-950">Desk map</h2>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100">
                  i
                </span>
              </div>
              {/* Desktop hover preview */}
              {showMapPreview && window.innerWidth >= 768 ? (
                <div className="absolute z-10 mt-4 hidden w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 md:block md:w-[560px]">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Kaleris seat plan</p>
                  <div className="mt-3">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Seat map</p>
                    <img src={seatMapImage} alt="Desk map preview" className="w-full rounded-3xl object-contain max-h-[72vh]" />
                  </div>
                  {!isKalerisUser ? (
                    <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Seat map preview is available only to @kaleris.com employees.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {/* Mobile overlay */}
              {showMapOverlay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" style={{ backdropFilter: 'blur(2px)' }}>
                  <div ref={mapOverlayRef} className="relative w-[95vw] max-w-md rounded-3xl bg-white p-4 shadow-xl flex flex-col items-center">
                    <button
                      className="absolute top-2 right-2 text-slate-500 hover:text-slate-900 text-2xl font-bold"
                      onClick={() => setShowMapOverlay(false)}
                      aria-label="Close map"
                    >
                      ×
                    </button>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Kaleris seat plan</p>
                    <img src={seatMapImage} alt="Desk map preview" className="w-full max-h-[60vh] object-contain rounded-2xl" />
                    {!isKalerisUser ? (
                      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        Seat map preview is available only to @kaleris.com employees.
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
              <p className="mt-3 text-sm text-slate-600">Reserve a desk for the selected day and manage your schedule.</p>
            </div>
            <DatePicker value={selectedDate} onChange={onDateChange} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <DeskFilter search={search} onSearch={setSearch} />
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Status guide</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-emerald-100 p-4 text-sm text-emerald-800">Available</div>
              <div className="rounded-3xl bg-rose-100 p-4 text-sm text-rose-800">Reserved</div>
              <div className="rounded-3xl bg-amber-100 p-4 text-sm text-amber-900">Your reservation</div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          {filteredDesks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-soft">
              No desks match your search. Try a different desk ID or clear the filter.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDesks.map((desk) => (
                <DeskCard
                  key={desk.id}
                  desk={desk}
                  reservation={getReservationByDesk(dateReservations, selectedDate, desk.id)}
                  currentUserId={user.id}
                  onReserve={onReserve}
                  onCancel={onCancel}
                  selectedDate={selectedDate}
                  disabledMessage={hasBookingToday ? 'You already have a reservation today' : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <ReservationSummary reservations={myReservations} />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Desk list</p>
          <div className="mt-4 grid gap-3">
            {desks.map((desk) => (
              <div key={desk.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {desk.id}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
