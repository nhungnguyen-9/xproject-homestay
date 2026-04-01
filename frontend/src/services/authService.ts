import type { UserRole, User, AuthTokens, AuthState, LoginResponse, RefreshResponse } from '@/types/auth';

const AUTH_STORAGE_KEY = 'nhacam_auth';
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { user: null, tokens: null, isAuthenticated: false };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user ?? null,
      tokens: parsed.tokens ?? null,
      isAuthenticated: !!(parsed.user && parsed.tokens),
    };
  } catch {
    return { user: null, tokens: null, isAuthenticated: false };
  }
}

function saveState(user: User, tokens: AuthTokens): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, tokens }));
}

function updateAccessToken(accessToken: string): void {
  const state = loadState();
  if (state.tokens) {
    saveState(state.user!, { ...state.tokens, accessToken });
  }
}

/**
 * Xoá toàn bộ thông tin xác thực khỏi localStorage
 */
export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Đăng nhập bằng tên người dùng và mật khẩu
 * @param username - Tên đăng nhập
 * @param password - Mật khẩu
 * @returns Phản hồi đăng nhập chứa thông tin user và token
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error ?? 'Login failed') as Error & { status: number };
    error.status = res.status;
    throw error;
  }

  const data: LoginResponse = await res.json();
  saveState(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

/**
 * Đăng xuất người dùng hiện tại, gửi yêu cầu logout lên server rồi xoá state cục bộ
 */
export async function logout(): Promise<void> {
  const tokens = getTokens();
  try {
    if (tokens?.accessToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });
    }
  } catch {
    // Bỏ qua lỗi — logout phía server không bắt buộc thành công
  }
  clearAuth();
}

/**
 * Làm mới access token bằng refresh token hiện có
 * @returns Access token mới
 */
export async function refreshToken(): Promise<string> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token');
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!res.ok) {
    clearAuth();
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Refresh failed');
  }

  const data: RefreshResponse = await res.json();
  updateAccessToken(data.accessToken);
  return data.accessToken;
}

/**
 * Lấy thông tin người dùng hiện tại từ localStorage
 * @returns Đối tượng User hoặc null nếu chưa đăng nhập
 */
export function getUser(): User | null {
  return loadState().user;
}

/**
 * Lấy cặp token xác thực (access + refresh) từ localStorage
 * @returns Đối tượng AuthTokens hoặc null nếu chưa đăng nhập
 */
export function getTokens(): AuthTokens | null {
  return loadState().tokens;
}

/**
 * Kiểm tra người dùng đã đăng nhập hay chưa
 * @returns true nếu đã xác thực
 */
export function isAuthenticated(): boolean {
  return loadState().isAuthenticated;
}

/**
 * Lấy vai trò của người dùng hiện tại
 * @returns Vai trò (UserRole), mặc định là 'staff'
 */
export function getRole(): UserRole {
  return getUser()?.role ?? 'staff';
}

/**
 * Kiểm tra người dùng hiện tại có phải admin không
 * @returns true nếu vai trò là 'admin'
 */
export function isAdmin(): boolean {
  return getRole() === 'admin';
}

/**
 * Lấy thông tin xác thực tương thích ngược cho các component cũ
 * @returns Đối tượng chứa currentRole và userName
 */
export function getAuth(): { currentRole: UserRole; userName: string } {
  const user = getUser();
  return {
    currentRole: user?.role ?? 'staff',
    userName: user?.displayName ?? user?.username ?? 'User',
  };
}

/**
 * Kiểm tra người dùng hiện tại có quyền thực hiện hành động hay không
 * @param action - Tên hành động cần kiểm tra (vd: 'view_bookings', 'add_booking')
 * @returns true nếu có quyền
 */
export function canPerform(permission: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.role === 'admin') return true;
  return (user.permissions ?? []).includes(permission);
}

/**
 * Lấy danh sách quyền của người dùng hiện tại
 * @returns Mảng tên quyền
 */
export function getPermissions(): string[] {
  return getUser()?.permissions ?? [];
}
