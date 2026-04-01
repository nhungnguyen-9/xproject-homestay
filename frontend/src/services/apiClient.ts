import * as authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Bỏ qua xác thực — dùng cho endpoint công khai (vd: GET /rooms trên homepage) */
  skipAuth?: boolean;
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
  const { body, headers: customHeaders, skipAuth, ...rest } = options;

  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {
    // Không gán Content-Type cho FormData — trình duyệt tự thêm boundary
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const tokens = authService.getTokens();
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }

  const serializeBody = (b: unknown): BodyInit | undefined => {
    if (b == null) return undefined;
    if (b instanceof FormData) return b;
    return JSON.stringify(b);
  };

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers,
    body: serializeBody(body),
  });

  // Tự động làm mới token: nếu 401 với thông báo "expired", thử refresh một lần
  if (res.status === 401 && !skipAuth) {
    const errorBody = await res.json().catch(() => ({}));
    const errorMsg: string = errorBody.error ?? '';
    const tokens = authService.getTokens();

    if (errorMsg.toLowerCase().includes('expired') && tokens?.refreshToken) {
      try {
        const newAccessToken = await authService.refreshToken();
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        res = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...rest,
          headers,
          body: serializeBody(body),
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
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
