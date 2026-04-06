/** Vai trò người dùng trong hệ thống */
export type UserRole = 'admin' | 'staff';

/** Thông tin người dùng đã xác thực */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  displayName: string | null;
  email: string | null;
  permissions: string[];
}

/** Cặp token xác thực (access + refresh) */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Trạng thái xác thực hiện tại của ứng dụng */
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

/** Phản hồi từ API khi đăng nhập thành công */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/** Phản hồi từ API khi làm mới token */
export interface RefreshResponse {
  accessToken: string;
}
