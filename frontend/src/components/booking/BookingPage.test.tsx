import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Booking } from '@/types/schedule'

vi.mock('@/services/roomService', () => ({
  getAll: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/bookingService', () => ({
  create: vi.fn(),
  getByDate: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/branchService', () => ({
  getAll: vi.fn().mockResolvedValue([]),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock RoomSchedule — capture onBookingCreate prop and expose a button that fires it
interface MockRoomScheduleProps {
  onBookingCreate?: (b: Omit<Booking, 'id'>) => void | Promise<void>
}
vi.mock('@/components/schedule/room-schedule', () => ({
  RoomSchedule: ({ onBookingCreate }: MockRoomScheduleProps) => (
    <button
      data-testid="fire-create"
      onClick={() =>
        onBookingCreate?.({
          roomId: 'room-1',
          date: '2026-04-20',
          startTime: '10:00',
          endTime: '12:00',
          status: 'pending',
          totalPrice: 200000,
          category: 'guest',
        } as Omit<Booking, 'id'>)
      }
    >
      fire
    </button>
  ),
}))

import { BookingPage } from './BookingPage'
import * as bookingService from '@/services/bookingService'
import { toast } from 'sonner'

describe('BookingPage — onBookingCreate wiring (task #6/#7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bookingService.getByDate).mockResolvedValue([])
  })

  it('passes onBookingCreate to RoomSchedule and calls bookingService.create on submit', async () => {
    vi.mocked(bookingService.create).mockResolvedValue({ id: 'b-1' } as Booking)

    render(<MemoryRouter><BookingPage /></MemoryRouter>)
    const fireBtn = await screen.findByTestId('fire-create')
    fireEvent.click(fireBtn)

    await waitFor(() => {
      expect(bookingService.create).toHaveBeenCalledTimes(1)
    })
    expect(bookingService.create).toHaveBeenCalledWith(
      expect.objectContaining({ roomId: 'room-1', date: '2026-04-20' }),
    )
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Đặt phòng thành công')
    })
  })

  it('shows error toast when bookingService.create rejects', async () => {
    vi.mocked(bookingService.create).mockRejectedValueOnce(new Error('overlap'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<MemoryRouter><BookingPage /></MemoryRouter>)
    const fireBtn = await screen.findByTestId('fire-create')
    fireEvent.click(fireBtn)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Đặt phòng thất bại, vui lòng thử lại')
    })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('refetches bookings by date after successful create', async () => {
    vi.mocked(bookingService.create).mockResolvedValue({ id: 'b-1' } as Booking)

    render(<MemoryRouter><BookingPage /></MemoryRouter>)
    const fireBtn = await screen.findByTestId('fire-create')

    await waitFor(() => {
      expect(bookingService.getByDate).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(fireBtn)

    // After create, handler fetches again to refresh list
    await waitFor(() => {
      expect(bookingService.getByDate).toHaveBeenCalledTimes(2)
    })
  })
})
