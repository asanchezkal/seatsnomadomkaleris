import { initialDesks } from '../data/mockData.js'

const DESK_KEY = 'office-seat-reservation-desks'
const RESERVATION_KEY = 'office-seat-reservation-reservations'
const USER_KEY = 'office-seat-reservation-user'

export function loadDesks() {
  const raw = localStorage.getItem(DESK_KEY)
  if (!raw) {
    localStorage.setItem(DESK_KEY, JSON.stringify(initialDesks))
    return initialDesks
  }

  try {
    return JSON.parse(raw)
  } catch (error) {
    localStorage.setItem(DESK_KEY, JSON.stringify(initialDesks))
    return initialDesks
  }
}

export function saveDesks(desks) {
  localStorage.setItem(DESK_KEY, JSON.stringify(desks))
}

export function loadReservations() {
  const raw = localStorage.getItem(RESERVATION_KEY)
  if (!raw) {
    localStorage.setItem(RESERVATION_KEY, JSON.stringify([]))
    return []
  }

  try {
    return JSON.parse(raw)
  } catch (error) {
    localStorage.setItem(RESERVATION_KEY, JSON.stringify([]))
    return []
  }
}

export function saveReservations(reservations) {
  localStorage.setItem(RESERVATION_KEY, JSON.stringify(reservations))
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch (error) {
    return null
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function removeCurrentUser() {
  localStorage.removeItem(USER_KEY)
}

export function clearReservations() {
  saveReservations([])
}
