export function getReservationsForDate(reservations, date) {
  return reservations.filter((reservation) => reservation.date === date)
}

export function getReservationByDesk(reservations, date, deskId) {
  return reservations.find((reservation) => reservation.date === date && reservation.deskId === deskId)
}

export function getUserReservations(reservations, userId) {
  return reservations
    .filter((reservation) => reservation.userId === userId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function canReserve(reservations, date, deskId, userId) {
  const reservedDesk = getReservationByDesk(reservations, date, deskId)
  const userBookedSameDay = reservations.some(
    (reservation) => reservation.date === date && reservation.userId === userId,
  )
  return !reservedDesk && !userBookedSameDay
}

export function createReservation(reservations, deskId, date, user) {
  const reservation = {
    id: `${deskId}-${date}-${user.id}-${Date.now()}`,
    deskId,
    date,
    userId: user.id,
    userName: user.name,
  }
  return [...reservations, reservation]
}

export function cancelReservation(reservations, reservationId, userId) {
  return reservations.filter((reservation) => reservation.id !== reservationId || reservation.userId !== userId)
}

export function removeDesk(desks, deskId) {
  return desks.filter((desk) => desk.id !== deskId)
}
