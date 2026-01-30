import type { Room, Booking } from '@/types/schedule';

// Demo rooms data
export const demoRooms: Room[] = [
    { id: 'g01', name: 'G01', type: 'standard' },
    { id: 'p102', name: 'P102', type: 'standard' },
    { id: 'p103', name: 'P103', type: 'standard' },
    { id: 'p104', name: 'P104', type: 'vip' },
    { id: 'p105', name: 'P105', type: 'vip' },
    { id: 'p106', name: 'P106', type: 'supervip' },
];

// Demo bookings data
export const demoBookings: Booking[] = [
    // G01
    { id: '1', roomId: 'g01', startTime: '00:00', endTime: '02:30', status: 'checked-out' },
    { id: '2', roomId: 'g01', startTime: '09:28', endTime: '10:15', status: 'confirmed' },
    { id: '3', roomId: 'g01', startTime: '12:45', endTime: '14:30', status: 'confirmed' },
    { id: '4', roomId: 'g01', startTime: '17:00', endTime: '18:00', status: 'confirmed' },
    { id: '5', roomId: 'g01', startTime: '20:00', endTime: '21:30', status: 'pending' },

    // P102
    { id: '6', roomId: 'p102', startTime: '00:00', endTime: '01:30', status: 'checked-out' },
    { id: '7', roomId: 'p102', startTime: '09:15', endTime: '10:00', status: 'confirmed' },
    { id: '8', roomId: 'p102', startTime: '14:20', endTime: '15:20', status: 'confirmed' },
    { id: '9', roomId: 'p102', startTime: '19:00', endTime: '21:12', status: 'pending' },

    // P103
    { id: '10', roomId: 'p103', startTime: '00:00', endTime: '00:00', status: 'checked-out' },
    { id: '11', roomId: 'p103', startTime: '10:04', endTime: '11:00', status: 'confirmed' },
    { id: '12', roomId: 'p103', startTime: '13:15', endTime: '14:30', status: 'confirmed' },
    { id: '13', roomId: 'p103', startTime: '15:45', endTime: '17:00', status: 'confirmed' },
    { id: '14', roomId: 'p103', startTime: '20:00', endTime: '21:00', status: 'pending' },

    // P104
    { id: '15', roomId: 'p104', startTime: '00:00', endTime: '00:00', status: 'checked-out' },
    { id: '16', roomId: 'p104', startTime: '09:28', endTime: '10:30', status: 'confirmed' },
    { id: '17', roomId: 'p104', startTime: '13:45', endTime: '15:00', status: 'confirmed' },
    { id: '18', roomId: 'p104', startTime: '17:19', endTime: '18:00', status: 'confirmed' },
    { id: '19', roomId: 'p104', startTime: '19:45', endTime: '21:00', status: 'pending' },

    // P105
    { id: '20', roomId: 'p105', startTime: '00:00', endTime: '01:30', status: 'checked-out' },
    { id: '21', roomId: 'p105', startTime: '11:36', endTime: '12:30', status: 'confirmed' },
    { id: '22', roomId: 'p105', startTime: '17:15', endTime: '19:00', status: 'confirmed' },
    { id: '23', roomId: 'p105', startTime: '21:00', endTime: '22:00', status: 'pending' },

    // P106
    { id: '24', roomId: 'p106', startTime: '00:00', endTime: '01:30', status: 'checked-out' },
    { id: '25', roomId: 'p106', startTime: '09:28', endTime: '10:30', status: 'confirmed' },
    { id: '26', roomId: 'p106', startTime: '15:30', endTime: '16:30', status: 'confirmed' },
    { id: '27', roomId: 'p106', startTime: '17:30', endTime: '18:30', status: 'confirmed' },
];
