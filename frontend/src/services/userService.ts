import { apiFetch } from './apiClient';

export interface StaffUser {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  displayName: string | null;
  email: string | null;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export async function getAll(): Promise<StaffUser[]> {
  return apiFetch<StaffUser[]>('/users');
}

export async function create(data: {
  username: string;
  password: string;
  displayName: string;
  email?: string;
  permissions?: string[];
}): Promise<StaffUser> {
  return apiFetch<StaffUser>('/users', { method: 'POST', body: data });
}

export async function update(id: string, data: {
  displayName?: string;
  email?: string | null;
  permissions?: string[];
}): Promise<StaffUser> {
  return apiFetch<StaffUser>(`/users/${id}`, { method: 'PUT', body: data });
}

export async function toggleActive(id: string): Promise<StaffUser> {
  return apiFetch<StaffUser>(`/users/${id}/toggle-active`, { method: 'PUT' });
}

export async function remove(id: string): Promise<void> {
  await apiFetch(`/users/${id}`, { method: 'DELETE' });
}
