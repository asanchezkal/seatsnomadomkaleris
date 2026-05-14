import { useState } from 'react'

const defaultUsers = [
  { id: 'jane.doe', name: 'Jane Doe', email: 'jane.doe@company.com' },
  { id: 'mark.tan', name: 'Mark Tan', email: 'mark.tan@company.com' },
  { id: 'alex.kim', name: 'Alex Kim', email: 'alex.kim@company.com' },
]

export default function LoginPage({ onLogin }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) {
      setError('Enter your name or email to continue.')
      return
    }

    const existing = defaultUsers.find(
      (user) => user.name.toLowerCase() === trimmed.toLowerCase() || user.email.toLowerCase() === trimmed.toLowerCase(),
    )

    const profile = existing || {
      id: trimmed.toLowerCase().replace(/\s+/g, '.'),
      name: trimmed,
      email: trimmed.includes('@') ? trimmed : `${trimmed.replace(/\s+/g, '.')}@company.com`,
    }

    onLogin(profile)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Internal tool</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Office Desk Reservations</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in with your email or username to reserve a desk for today.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Username or email
            <input
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                setError('')
              }}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Jane Doe or jane.doe@company.com"
            />
          </label>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
          >
            Continue
          </button>
        </form>

        <div className="mt-8 rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-400 ring-1 ring-white/5">
          <p className="font-medium text-slate-100">Example accounts</p>
          <ul className="mt-2 space-y-1">
            {defaultUsers.map((user) => (
              <li key={user.id}>{user.name} — {user.email}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
