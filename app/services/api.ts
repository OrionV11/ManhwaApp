// services/api.ts
import { LoginResponse, Media } from './Manhwa';

const API_BASE_URL = 'http://localhost:3000';

export const api = {
    // Media endpoints
    getTrending: async (limit: number = 10): Promise<Media[]> => {
        const res = await fetch(`${API_BASE_URL}/api/media/trending?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch trending');
        return res.json();
    },

    searchMedia: async (query: string, type?: string, genre?: string): Promise<Media[]> => {
        const params = new URLSearchParams({ query });
        if (type) params.append('type', type);
        if (genre) params.append('genre', genre);
        const res = await fetch(`${API_BASE_URL}/api/media/search?${params}`);
        if (!res.ok) throw new Error('Failed to search');
        return res.json();
    },

    getMediaById: async (id: number): Promise<Media> => {
        const res = await fetch(`${API_BASE_URL}/api/media/${id}`);
        if (!res.ok) throw new Error('Failed to fetch media');
        return res.json();
    },

    // Auth endpoints
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    },

    signup: async (name: string, email: string, password: string) => {
        const res = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!res.ok) throw new Error('Signup failed');
        return res.json();
    }
};