/** Thông tin chi nhánh đầy đủ từ API backend */
export interface Branch {
    id: string;
    name: string;
    address: string;
    district: string | null;
    phone: string | null;
    images: string[];
    createdAt: string;
    updatedAt: string;
}

/** Payload cho form tạo/sửa chi nhánh */
export interface CreateBranchPayload {
    name: string;
    address: string;
    district?: string;
    phone?: string;
}
