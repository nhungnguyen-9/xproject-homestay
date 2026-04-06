import type { Room, Booking } from '@/types/schedule';

/** Dữ liệu mẫu danh sách phòng */
export const demoRooms: Room[] = [
    { id: 'g01', name: 'G01', type: 'standard' },
    { id: 'p102', name: 'P102', type: 'standard' },
    { id: 'p103', name: 'P103', type: 'standard' },
    { id: 'p104', name: 'P104', type: 'vip' },
    { id: 'p105', name: 'P105', type: 'vip' },
    { id: 'p106', name: 'P106', type: 'supervip' },
];

/** Dữ liệu mẫu danh sách đặt phòng */
export const demoBookings: Booking[] = [
    { id: '1', roomId: 'g01', date: '2026-03-20', startTime: '00:00', endTime: '02:30', status: 'checked-out', totalPrice: 422500, category: 'guest' as const },
    { id: '2', roomId: 'g01', date: '2026-03-20', startTime: '09:28', endTime: '10:15', status: 'confirmed', totalPrice: 132217, category: 'guest' as const },
    { id: '3', roomId: 'g01', date: '2026-03-20', startTime: '12:45', endTime: '14:30', status: 'confirmed', totalPrice: 295750, category: 'guest' as const },
    { id: '4', roomId: 'g01', date: '2026-03-20', startTime: '17:00', endTime: '18:00', status: 'confirmed', totalPrice: 169000, category: 'guest' as const },
    { id: '5', roomId: 'g01', date: '2026-03-20', startTime: '20:00', endTime: '21:30', status: 'pending', totalPrice: 253500, category: 'guest' as const },

    { id: '6', roomId: 'p102', date: '2026-03-20', startTime: '00:00', endTime: '01:30', status: 'checked-out', totalPrice: 253500, category: 'guest' as const },
    { id: '7', roomId: 'p102', date: '2026-03-20', startTime: '09:15', endTime: '10:00', status: 'confirmed', totalPrice: 126750, category: 'guest' as const },
    { id: '8', roomId: 'p102', date: '2026-03-20', startTime: '14:20', endTime: '15:20', status: 'confirmed', totalPrice: 169000, category: 'guest' as const },
    { id: '9', roomId: 'p102', date: '2026-03-20', startTime: '19:00', endTime: '21:12', status: 'pending', totalPrice: 373880, category: 'guest' as const },

    { id: '10', roomId: 'p103', date: '2026-03-20', startTime: '00:00', endTime: '00:00', status: 'checked-out', totalPrice: 0, category: 'guest' as const },
    { id: '11', roomId: 'p103', date: '2026-03-20', startTime: '10:04', endTime: '11:00', status: 'confirmed', totalPrice: 157633, category: 'guest' as const },
    { id: '12', roomId: 'p103', date: '2026-03-20', startTime: '13:15', endTime: '14:30', status: 'confirmed', totalPrice: 211250, category: 'guest' as const },
    { id: '13', roomId: 'p103', date: '2026-03-20', startTime: '15:45', endTime: '17:00', status: 'confirmed', totalPrice: 211250, category: 'guest' as const },
    { id: '14', roomId: 'p103', date: '2026-03-20', startTime: '20:00', endTime: '21:00', status: 'pending', totalPrice: 169000, category: 'guest' as const },

    { id: '15', roomId: 'p104', date: '2026-03-20', startTime: '00:00', endTime: '00:00', status: 'checked-out', totalPrice: 0, category: 'guest' as const },
    { id: '16', roomId: 'p104', date: '2026-03-20', startTime: '09:28', endTime: '10:30', status: 'confirmed', totalPrice: 21700, category: 'guest' as const },
    { id: '17', roomId: 'p104', date: '2026-03-20', startTime: '13:45', endTime: '15:00', status: 'confirmed', totalPrice: 26250, category: 'guest' as const },
    { id: '18', roomId: 'p104', date: '2026-03-20', startTime: '17:19', endTime: '18:00', status: 'confirmed', totalPrice: 14350, category: 'guest' as const },
    { id: '19', roomId: 'p104', date: '2026-03-20', startTime: '19:45', endTime: '21:00', status: 'pending', totalPrice: 26250, category: 'guest' as const },

    { id: '20', roomId: 'p105', date: '2026-03-20', startTime: '00:00', endTime: '01:30', status: 'checked-out', totalPrice: 31500, category: 'guest' as const },
    { id: '21', roomId: 'p105', date: '2026-03-20', startTime: '11:36', endTime: '12:30', status: 'confirmed', totalPrice: 18900, category: 'guest' as const },
    { id: '22', roomId: 'p105', date: '2026-03-20', startTime: '17:15', endTime: '19:00', status: 'confirmed', totalPrice: 36750, category: 'guest' as const },
    { id: '23', roomId: 'p105', date: '2026-03-20', startTime: '21:00', endTime: '22:00', status: 'pending', totalPrice: 21000, category: 'guest' as const },

    { id: '24', roomId: 'p106', date: '2026-03-20', startTime: '00:00', endTime: '01:30', status: 'checked-out', totalPrice: 403500, category: 'guest' as const },
    { id: '25', roomId: 'p106', date: '2026-03-20', startTime: '09:28', endTime: '10:30', status: 'confirmed', totalPrice: 278367, category: 'guest' as const },
    { id: '26', roomId: 'p106', date: '2026-03-20', startTime: '15:30', endTime: '16:30', status: 'confirmed', totalPrice: 269000, category: 'guest' as const },
    { id: '27', roomId: 'p106', date: '2026-03-20', startTime: '17:30', endTime: '18:30', status: 'confirmed', totalPrice: 269000, category: 'guest' as const },

    { id: '28', roomId: 'g01', date: '2026-03-20', startTime: '08:00', endTime: '08:30', status: 'confirmed', totalPrice: 0, category: 'internal' as const, internalTag: 'cleaning', internalNote: 'Dọn phòng sau check-out', createdBy: 'Admin' },
    { id: '29', roomId: 'p102', date: '2026-03-20', startTime: '13:00', endTime: '15:00', status: 'confirmed', totalPrice: 0, category: 'internal' as const, internalTag: 'maintenance', internalNote: 'Sửa điều hòa', createdBy: 'Admin' },
    { id: '30', roomId: 'p104', date: '2026-03-21', startTime: '00:00', endTime: '23:59', status: 'confirmed', totalPrice: 0, category: 'internal' as const, internalTag: 'locked', internalNote: 'Đang trang trí lại', createdBy: 'Admin' },
];
