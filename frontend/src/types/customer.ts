/** Thông tin khách hàng cơ bản */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  note?: string;
  createdAt: string;
}

/** Thông tin khách hàng kèm thống kê sử dụng dịch vụ */
export interface CustomerWithStats extends Customer {
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
}
