import type { UserRole, AuthState } from '@/types/auth';

const STORAGE_KEY = 'nhacam_auth';

const DEFAULT_STATE: AuthState = {
  currentRole: 'admin',
  userName: 'Admin',
};

export function getAuth(): AuthState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  }
  return JSON.parse(stored);
}

export function getRole(): UserRole {
  return getAuth().currentRole;
}

export function setRole(role: UserRole): void {
  const state = getAuth();
  state.currentRole = role;
  state.userName = role === 'admin' ? 'Admin' : 'Staff';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
}

export function canPerform(action: string): boolean {
  const role = getRole();
  const staffAllowed = ['view_bookings', 'add_booking', 'change_status'];
  if (role === 'admin') return true;
  return staffAllowed.includes(action);
}
