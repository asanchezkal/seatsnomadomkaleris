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
