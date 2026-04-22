import { apiFetch } from './apiClient';

export type FoodItemCategory = 'item' | 'combo' | 'drink' | 'service';

export interface ApiFoodItem {
    id: string;
    name: string;
    price: number;
    image: string | null;
    category: FoodItemCategory;
    isActive: boolean;
    sortOrder: number;
}

export type CreateFoodItemPayload = Omit<ApiFoodItem, 'id'>;

export async function getAll(category?: FoodItemCategory): Promise<ApiFoodItem[]> {
    const query = category ? `?category=${category}` : '';
    return apiFetch<ApiFoodItem[]>(`/food-items${query}`);
}

export async function getPublic(category?: FoodItemCategory): Promise<ApiFoodItem[]> {
    const query = category ? `?category=${category}` : '';
    return apiFetch<ApiFoodItem[]>(`/food-items/public${query}`, { skipAuth: true });
}

export async function create(data: CreateFoodItemPayload): Promise<ApiFoodItem> {
    return apiFetch<ApiFoodItem>('/food-items', { method: 'POST', body: data });
}

export async function update(id: string, data: Partial<CreateFoodItemPayload>): Promise<ApiFoodItem> {
    return apiFetch<ApiFoodItem>(`/food-items/${id}`, { method: 'PUT', body: data });
}

export async function remove(id: string): Promise<void> {
    await apiFetch<void>(`/food-items/${id}`, { method: 'DELETE' });
}

export async function uploadImage(id: string, file: File): Promise<ApiFoodItem> {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<ApiFoodItem>(`/food-items/${id}/image`, { method: 'POST', body: formData });
}
