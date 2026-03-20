export type UserRole = 'admin' | 'staff';

export interface AuthState {
  currentRole: UserRole;
  userName: string;
}
