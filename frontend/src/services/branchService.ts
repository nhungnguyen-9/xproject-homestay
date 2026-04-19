import { apiFetch } from './apiClient';
import type { Branch, CreateBranchPayload } from '@/types/branch';

/**
 * Lấy danh sách tất cả chi nhánh (công khai — không cần auth)
 */
export async function getAll(): Promise<Branch[]> {
    return apiFetch<Branch[]>('/branches', { skipAuth: true });
}

/**
 * Lấy chi tiết một chi nhánh theo ID (công khai — không cần auth)
 */
export async function getById(id: string): Promise<Branch> {
    return apiFetch<Branch>(`/branches/${id}`, { skipAuth: true });
}

/**
 * Tạo chi nhánh mới (Admin only)
 */
export async function create(data: CreateBranchPayload): Promise<Branch> {
    return apiFetch<Branch>('/branches', {
        method: 'POST',
        body: data,
    });
}

/**
 * Cập nhật thông tin chi nhánh (Admin only)
 */
export async function update(id: string, data: Partial<CreateBranchPayload>): Promise<Branch> {
    return apiFetch<Branch>(`/branches/${id}`, {
        method: 'PUT',
        body: data,
    });
}

/**
 * Xoá chi nhánh (Admin only)
 */
export async function remove(id: string): Promise<void> {
    await apiFetch<void>(`/branches/${id}`, {
        method: 'DELETE',
    });
}

/** Response chỉ chứa mảng ảnh */
interface ImagesResponse {
    images: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://103.57.220.186/api/v1';
/** Gốc server backend (bỏ /api/v1) — dùng để truy cập file tĩnh */
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/, '');

/** Chuyển đường dẫn ảnh tương đối thành URL tuyệt đối */
export function imageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${BACKEND_ORIGIN}${path}`;
}

/**
 * Upload nhiều ảnh cho chi nhánh (batch) — gửi FormData với field "files"
 */
export async function uploadImages(branchId: string, files: File[]): Promise<ImagesResponse> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return apiFetch<ImagesResponse>(`/branches/${branchId}/images`, {
        method: 'POST',
        body: formData,
    });
}

/**
 * Xoá ảnh khỏi chi nhánh
 */
export async function deleteImage(branchId: string, imageUrl: string): Promise<ImagesResponse> {
    return apiFetch<ImagesResponse>(`/branches/${branchId}/images`, {
        method: 'DELETE',
        body: { imageUrl },
    });
}
