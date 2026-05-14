export default function DeskFilter({ search, onSearch }) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <label className="flex w-full flex-col gap-2 text-sm text-slate-700">
        Search desks
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search by desk id"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
        />
      </label>
    </div>
  )
}
