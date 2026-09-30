import { describe, it, expect } from 'vitest'
import { PARKING_ID, canReserve, canReserveParking, getParkingReservation, getReservationLabel } from './reservationService.js'

const date = '2026-10-01'
const seat = (deskId, userId, d = date) => ({ id: `${deskId}-${userId}`, deskId, date: d, userId })

describe('canReserve (desks)', () => {
  it('blocks a second desk for the same user on the same day', () => {
    expect(canReserve([seat('A1', 'ana')], date, 'A2', 'ana')).toBe(false)
  })

  it('still allows a desk when the user only holds the parking spot', () => {
    expect(canReserve([seat(PARKING_ID, 'ana')], date, 'A1', 'ana')).toBe(true)
  })
})

describe('canReserveParking', () => {
  it('allows parking when nobody holds it that day', () => {
    expect(canReserveParking([], date)).toBe(true)
  })

  it('allows parking for a user who already has a desk that day', () => {
    expect(canReserveParking([seat('A1', 'ana')], date)).toBe(true)
  })

  it('blocks parking when another user already holds it that day', () => {
    expect(canReserveParking([seat(PARKING_ID, 'bob')], date)).toBe(false)
  })

  it('allows parking on a different day than an existing booking', () => {
    expect(canReserveParking([seat(PARKING_ID, 'bob', '2026-10-02')], date)).toBe(true)
  })
})

describe('getParkingReservation', () => {
  it('returns the parking reservation for the date', () => {
    const parking = seat(PARKING_ID, 'bob')
    expect(getParkingReservation([seat('A1', 'ana'), parking], date)).toBe(parking)
  })
})

describe('getReservationLabel', () => {
  it('labels parking and desks differently', () => {
    expect(getReservationLabel({ deskId: PARKING_ID })).toBe('Parking spot')
    expect(getReservationLabel({ deskId: 'A1' })).toBe('Desk A1')
  })
})
