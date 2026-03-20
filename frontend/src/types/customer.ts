export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  note?: string;
  createdAt: string;
}

export interface CustomerWithStats extends Customer {
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
}
