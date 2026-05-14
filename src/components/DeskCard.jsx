import { formatDateLabel } from '../utils/dateUtils.js'

export default function DeskCard({ desk, reservation, currentUserId, onReserve, onCancel, selectedDate, disabledMessage }) {
  const isReserved = Boolean(reservation)
  const isMine = reservation?.userId === currentUserId
  const state = isMine ? 'yellow' : isReserved ? 'red' : 'green'

  const statusStyles = {
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-rose-100 text-rose-800',
    yellow: 'bg-amber-100 text-amber-900',
  }

  return (
    <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Desk</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">{desk.label}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[state]}`}>
          {isMine ? 'Your desk' : isReserved ? 'Booked' : 'Available'}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>Reservation date:</p>
        <p className="text-slate-900 font-medium">{formatDateLabel(selectedDate)}</p>
        <p className="truncate text-slate-500">
          {isReserved ? `Reserved by ${reservation.userName}` : 'This desk is free for the selected day.'}
        </p>
      </div>

      <div className="mt-5">
        {isMine ? (
          <button
            type="button"
            onClick={() => onCancel(reservation.id)}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            Cancel reservation
          </button>
        ) : disabledMessage ? (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          >
            {disabledMessage}
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
            onClick={() => onReserve(desk.id)}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Reserve this desk
          </button>
        )}
      </div>
    </article>
  )
}
