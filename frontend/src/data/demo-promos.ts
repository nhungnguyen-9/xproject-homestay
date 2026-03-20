import type { PromoCode } from '@/types/promo';

export const demoPromos: PromoCode[] = [
  {
    id: 'pr1', code: 'SUMMER20', discountType: 'percent', discountValue: 20,
    maxUses: 50, usedCount: 5, startDate: '2026-03-01', endDate: '2026-03-31',
    applicableRoomTypes: [], status: 'active', createdAt: '2026-03-01',
  },
  {
    id: 'pr2', code: 'VIP50K', discountType: 'fixed', discountValue: 50000,
    maxUses: 20, usedCount: 12, startDate: '2026-03-01', endDate: '2026-04-15',
    applicableRoomTypes: ['vip', 'supervip'], status: 'active', createdAt: '2026-03-01',
  },
  {
    id: 'pr3', code: 'TETHOLIDAY', discountType: 'percent', discountValue: 15,
    maxUses: 50, usedCount: 50, startDate: '2026-01-15', endDate: '2026-02-28',
    applicableRoomTypes: [], status: 'expired', createdAt: '2026-01-15',
  },
];
