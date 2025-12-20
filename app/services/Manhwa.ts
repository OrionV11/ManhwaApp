//interface ts

export interface Media {
    id: string;
    type: string;
    title_romaji: string;
    title_english: string; 
    description: string;
    cover_image_url: string;
    genres: string[];
    average_score: number | null; 
    popularity_rank: number | null; 
    mal_id: number;
    episodes: number | null;
    status: string;
    year_released: number | null;
    season: string | null;  // Can be null
    source: string | null;  // Can be null
    last_synced_at?: string;  // Optional timestamp
    created_at?: string;  // Optional timestamp
}

export interface Anime extends Media {
    type: 'ANIME';
    episodes: number | null;
    season: string | null;
}

export interface Manga extends Media {
    type: 'MANGA';
    chapters: number | null;
}