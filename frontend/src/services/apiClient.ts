import * as authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

/**
 * Gọi API có xác thực, tự động làm mới token khi hết hạn
 * @param endpoint - Đường dẫn API (vd: '/bookings')
 * @param options - Tuỳ chọn request (method, body, headers, ...)
 * @returns Dữ liệu phản hồi đã parse từ JSON
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const tokens = authService.getTokens();
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  // Tự động làm mới token: nếu 401 với thông báo "expired", thử refresh một lần
  if (res.status === 401) {
    const errorBody = await res.json().catch(() => ({}));
    const errorMsg: string = errorBody.error ?? '';

    if (errorMsg.toLowerCase().includes('expired') && tokens?.refreshToken) {
      try {
        const newAccessToken = await authService.refreshToken();
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        res = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...rest,
          headers,
          body: body != null ? JSON.stringify(body) : undefined,
        });
      } catch {
        authService.clearAuth();
        window.location.href = '/admin/login';
        throw new ApiError(401, 'Session expired');
      }
    } else {
      throw new ApiError(401, errorMsg || 'Unauthorized');
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorBody.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

/**
 * Lỗi API tuỳ chỉnh kèm mã trạng thái HTTP
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
