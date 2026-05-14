# Office Seat Reservation

A lightweight React + Vite internal web app for office desk reservations.

## Features

- Employee login with username or email
- Desk map with availability, reservation status, and owner display
- Date-based desk reservation and cancellation
- Admin panel with desk management and reservation clearing
- LocalStorage persistence for users, desks, and reservations
- Mobile responsive UI with Tailwind CSS

## Local Setup

1. Open a terminal in `C:\Users\Antonio.Sanchez\projects\office-seat-reservation`
2. Run `npm install`
3. Run `npm run dev`
4. Open the local URL shown in the terminal

## Build

- `npm run build`

## Supabase shared backend

This app supports shared reservations via Supabase.

1. Create a new Supabase project.
2. Add the following tables:

### `desks`
- `id` text (primary key)
- `label` text

### `reservations`
- `id` text (primary key)
- `desk_id` text
- `date` text
- `user_id` text
- `user_name` text
- `user_email` text
- `created_at` timestamp with time zone (optional)

3. In Vercel, set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Locally, copy `.env.example` to `.env` and fill the values.

The app will use Supabase when those values are available, so reservations will be shared across browsers and devices.

## Admin Panel

- Password: `office-admin-2026`
- Add and remove desks, clear reservations, and view all bookings.

## Vercel Deployment

1. Push the repository to GitHub.
2. Connect the repo to Vercel.
3. Use the default Vite build settings.
4. Ensure the root directory is set to `/`.
5. Vercel will run `npm install` and `npm run build`.

The included `vercel.json` file ensures SPA routing works correctly on Vercel.
