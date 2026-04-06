import { apiFetch } from './apiClient';
import type { RoomDetail } from '@/types/room';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://103.57.220.186/api/v1';
/** Gốc server backend (bỏ /api/v1) — dùng để truy cập file tĩnh */
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/, '');

/** Chuyển đường dẫn ảnh tương đối thành URL tuyệt đối */
export function imageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${BACKEND_ORIGIN}${path}`;
}

/** Response chỉ chứa mảng ảnh (dùng cho upload/delete/reorder) */
interface ImagesResponse {
  images: string[];
}

/**
 * Lấy danh sách tất cả phòng đang hoạt động (public — không cần auth)
 */
export async function getAll(params?: { branchId?: string; type?: string }): Promise<RoomDetail[]> {
  const query = new URLSearchParams();
  if (params?.branchId) query.set('branchId', params.branchId);
  if (params?.type) query.set('type', params.type);
  const qs = query.toString();
  return apiFetch<RoomDetail[]>(`/rooms${qs ? `?${qs}` : ''}`, { skipAuth: true });
}

/**
 * Lấy chi tiết một phòng theo ID
 */
export async function getById(id: string): Promise<RoomDetail> {
  return apiFetch<RoomDetail>(`/rooms/${id}`, { skipAuth: true });
}

/**
 * Upload nhiều ảnh cho phòng (batch) — gửi FormData với field "files"
 * @returns Mảng URL ảnh đã cập nhật
 */
export async function uploadImages(roomId: string, files: File[]): Promise<ImagesResponse> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  return apiFetch<ImagesResponse>(`/rooms/${roomId}/images`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Xoá ảnh khỏi phòng — gửi full imageUrl trong body
 * @param roomId - ID phòng
 * @param imageUrl - Đường dẫn đầy đủ (vd: "/uploads/rooms/g01-123-0.jpg")
 * @returns Mảng URL ảnh đã cập nhật
 */
export async function deleteImage(roomId: string, imageUrl: string): Promise<ImagesResponse> {
  return apiFetch<ImagesResponse>(`/rooms/${roomId}/images`, {
    method: 'DELETE',
    body: { imageUrl },
  });
}

/**
 * Sắp xếp lại thứ tự ảnh — endpoint riêng PUT /rooms/:id/images/reorder
 * @returns Mảng URL ảnh đã cập nhật
 */
export async function reorderImages(roomId: string, images: string[]): Promise<ImagesResponse> {
  return apiFetch<ImagesResponse>(`/rooms/${roomId}/images/reorder`, {
    method: 'PUT',
    body: { images },
  });
}

/**
 * Thay thế 1 ảnh phòng bằng ảnh mới — giữ nguyên vị trí
 */
export async function replaceImage(roomId: string, oldImageUrl: string, newFile: File): Promise<ImagesResponse> {
  const formData = new FormData();
  formData.append('oldImageUrl', oldImageUrl);
  formData.append('file', newFile);
  return apiFetch<ImagesResponse>(`/rooms/${roomId}/images/replace`, {
    method: 'PUT',
    body: formData,
  });
}
