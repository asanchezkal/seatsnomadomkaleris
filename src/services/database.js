import { supabase } from './supabaseClient.js'
import { initialDesks } from '../data/mockData.js'

const DESK_TABLE = 'desks'
const RESERVATION_TABLE = 'reservations'

const logSupabaseError = (message, error) => {
  if (error) {
    console.error(message, error)
  }
}

export async function fetchDesks() {
  const { data, error } = await supabase.from(DESK_TABLE).select('*').order('id', { ascending: true })
  logSupabaseError('Error fetching desks', error)
  return { data: data || [], error }
}

export async function fetchReservations() {
  const { data, error } = await supabase.from(RESERVATION_TABLE).select('*').order('date', { ascending: true })
  logSupabaseError('Error fetching reservations', error)
  return { data: data || [], error }
}

export async function ensureInitialDesks() {
  const { data: desks, error: fetchError } = await fetchDesks()
  if (fetchError) {
    return { data: null, error: fetchError }
  }

  if (desks.length > 0) {
    return { data: desks, error: null }
  }

  const { data, error } = await supabase
    .from(DESK_TABLE)
    .insert(initialDesks.map((desk) => ({ id: desk.id, label: desk.label })))
  logSupabaseError('Error inserting initial desks', error)
  return { data: data || null, error }
}

export async function createDesk(desk) {
  const { data, error } = await supabase.from(DESK_TABLE).insert({ id: desk.id, label: desk.label }).select()
  logSupabaseError('Error creating desk', error)
  return { data: data?.[0] || null, error }
}

export async function removeDesk(deskId) {
  const { error } = await supabase.from(DESK_TABLE).delete().eq('id', deskId)
  logSupabaseError('Error removing desk', error)
  return { error }
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
  logSupabaseError('Error creating reservation', error)
  return { data: data?.[0] || null, error }
}

export async function cancelReservation(reservationId, userId) {
  const { error } = await supabase
    .from(RESERVATION_TABLE)
    .delete()
    .eq('id', reservationId)
    .eq('user_id', userId)

  logSupabaseError('Error canceling reservation', error)
  return { error }
}

export async function clearAllReservations() {
  const { error } = await supabase.from(RESERVATION_TABLE).delete().neq('id', '')
  logSupabaseError('Error clearing reservations', error)
  return { error }
}
