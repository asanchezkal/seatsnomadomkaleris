import { supabase } from './supabaseClient.js'
import { initialDesks } from '../data/mockData.js'

const DESK_TABLE = 'desks'
const RESERVATION_TABLE = 'reservations'

export async function fetchDesks() {
  const { data, error } = await supabase.from(DESK_TABLE).select('*').order('id', { ascending: true })
  if (error) {
    console.error('Error fetching desks', error)
    return []
  }
  return data || []
}

export async function fetchReservations() {
  const { data, error } = await supabase.from(RESERVATION_TABLE).select('*').order('date', { ascending: true })
  if (error) {
    console.error('Error fetching reservations', error)
    return []
  }
  return data || []
}

export async function ensureInitialDesks() {
  const desks = await fetchDesks()
  if (desks.length > 0) {
    return desks
  }

  const { error } = await supabase.from(DESK_TABLE).insert(initialDesks.map((desk) => ({ id: desk.id, label: desk.label })))
  if (error) {
    console.error('Error inserting initial desks', error)
    return initialDesks
  }

  return initialDesks
}

export async function createDesk(desk) {
  const { data, error } = await supabase.from(DESK_TABLE).insert({ id: desk.id, label: desk.label }).select()
  if (error) {
    console.error('Error creating desk', error)
    return null
  }
  return data?.[0] || desk
}

export async function removeDesk(deskId) {
  const { error } = await supabase.from(DESK_TABLE).delete().eq('id', deskId)
  if (error) {
    console.error('Error removing desk', error)
  }
}

export async function createReservation(deskId, date, user) {
  const id = `${deskId}-${date}-${user.id}`
  const reservation = {
    id,
    desk_id: deskId,
    date,
    user_id: user.id,
    user_name: user.name,
    user_email: user.email,
  }

  const { data, error } = await supabase.from(RESERVATION_TABLE).insert(reservation).select()
  if (error) {
    console.error('Error creating reservation', error)
    return null
  }

  return data?.[0]
}

export async function cancelReservation(reservationId, userId) {
  const { error } = await supabase
    .from(RESERVATION_TABLE)
    .delete()
    .eq('id', reservationId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error canceling reservation', error)
  }
}

export async function clearAllReservations() {
  const { error } = await supabase.from(RESERVATION_TABLE).delete().neq('id', '')
  if (error) {
    console.error('Error clearing reservations', error)
  }
}
