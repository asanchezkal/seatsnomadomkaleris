import { supabase } from './supabaseClient.js'
import { initialDesks } from '../data/mockData.js'

const DESK_TABLE = 'desks'
const RESERVATION_TABLE = 'reservations'
const USER_TABLE = 'users'

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
  const id = `${deskId}-${date}-${user.id}-${Date.now()}`
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

export async function fetchUsers() {
  const { data, error } = await supabase.from(USER_TABLE).select('*').order('email', { ascending: true })
  logSupabaseError('Error fetching users', error)
  return { data: data || [], error }
}

export async function createUser(email, password) {
  const { data, error } = await supabase.from(USER_TABLE).insert({ email, password }).select()
  logSupabaseError('Error creating user', error)
  return { data: data?.[0] || null, error }
}

export async function deleteUser(email) {
  const { error } = await supabase.from(USER_TABLE).delete().eq('email', email)
  logSupabaseError('Error deleting user', error)
  return { error }
}

export async function updateUserPassword(email, newPassword) {
  const { error } = await supabase.from(USER_TABLE).update({ password: newPassword }).eq('email', email)
  logSupabaseError('Error updating user password', error)
  return { error }
}

export async function validateUser(email, password) {
  const { data, error } = await supabase
    .from(USER_TABLE)
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .maybeSingle()
  logSupabaseError('Error validating user', error)
  return { data: data || null, error }
}
