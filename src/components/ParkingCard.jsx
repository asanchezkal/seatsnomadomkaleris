import { formatDateLabel } from '../utils/dateUtils.js'
import { PARKING_ID } from '../services/reservationService.js'

export default function ParkingCard({ reservation, currentUserId, onReserve, onCancel, selectedDate }) {
  const isReserved = Boolean(reservation)
  const isMine = reservation?.userId === currentUserId
  const state = isMine ? 'yellow' : isReserved ? 'red' : 'green'

  const statusStyles = {
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-rose-100 text-rose-800',
    yellow: 'bg-amber-100 text-amber-900',
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Parking</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">Parking spot</h2>
          <p className="mt-2 text-sm text-slate-600">
            One spot available for {formatDateLabel(selectedDate)}. You can book it in addition to your desk.
          </p>
          <p className="mt-1 truncate text-sm text-slate-500">
            {isReserved ? `Reserved by ${reservation.userName}` : 'The parking spot is free for the selected day.'}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:w-56">
          <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-end ${statusStyles[state]}`}>
            {isMine ? 'Your spot' : isReserved ? 'Booked' : 'Available'}
          </span>
          {isMine ? (
            <button
              type="button"
              onClick={() => onCancel(reservation.id)}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Cancel parking
            </button>
          ) : isReserved ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
            >
              Not available
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReserve(PARKING_ID)}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Reserve parking
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
