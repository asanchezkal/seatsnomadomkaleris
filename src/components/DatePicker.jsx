export default function DatePicker({ value, onChange }) {
  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 15)
  const max = maxDate.toISOString().split('T')[0]

  return (
    <label className="flex w-full max-w-xs flex-col gap-2 text-sm text-slate-700">
      Select reservation date
      <input
        type="date"
        value={value}
        min={today}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
      />
    </label>
  )
}
