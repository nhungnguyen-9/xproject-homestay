/** Thông tin khách hàng cơ bản */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  note?: string;
  idImageUrls?: string[];
  createdAt: string;
}

/** Thông tin khách hàng kèm thống kê sử dụng dịch vụ */
export interface CustomerWithStats extends Customer {
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
}

/** Kết quả tra cứu khách hàng theo SĐT (dùng cho booking form auto-fill) */
export interface CustomerLookup {
  id: string;
  name: string;
  phone: string;
  hasIdImages: boolean;
  idImageUrls: string[];
}
