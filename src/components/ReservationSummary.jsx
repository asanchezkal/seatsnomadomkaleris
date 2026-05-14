import { formatDateLabel } from '../utils/dateUtils.js'

export default function ReservationSummary({ reservations }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Your upcoming</p>
          <h2 className="text-xl font-semibold text-slate-950">My reservations</h2>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
          {reservations.length} item{reservations.length === 1 ? '' : 's'}
        </span>
      </div>

      {reservations.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          No upcoming desk reservations yet. Pick a date and reserve a desk to see it here.
        </p>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Desk {reservation.deskId}</p>
              <p className="text-sm text-slate-600">{formatDateLabel(reservation.date)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
