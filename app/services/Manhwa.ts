// Base Media interface matching PostgreSQL schema
export interface Media {
    id: number;
    title_romaji: string;
    title_english: string | null;
    title_native: string | null;
    type: 'MANGA' | 'MANHWA' | 'MANHUA' | 'ANIME';
    format: string | null; // 'TV', 'MOVIE', 'OVA', 'SPECIAL', 'MANGA', 'ONE_SHOT'
    status: string | null; // 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED'
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    chapters: number | null;
    volumes: number | null;
    episodes: number | null;
    cover_image: string | null;
    banner_image: string | null;
    genres: string[];
    tags: string[];
    average_score: number | null; // DECIMAL(4,2)
    popularity: number;
    favorites: number;
    source: string | null; // 'ORIGINAL', 'MANGA', 'LIGHT_NOVEL', 'WEB_NOVEL'
    country_of_origin: string | null; // 'JP', 'KR', 'CN'
    created_at: string;
    updated_at: string;
}

// User interface
export interface User {
    id: number;
    username: string;
    email: string;
    profile_picture?: string | null;
    bio?: string | null;
    created_at: string;
    updated_at: string;
}

// User Media List Entry
export interface UserMediaList {
    id: number;
    user_id: number;
    media_id: number;
    status: 'READING' | 'COMPLETED' | 'PLAN_TO_READ' | 'DROPPED' | 'ON_HOLD';
    score: number | null; // 0-10 rating
    progress: number; // Chapters/episodes read
    notes: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    media?: Media; // Optional populated media data
}

// Media Like
export interface MediaLike {
    id: number;
    user_id: number;
    media_id: number;
    created_at: string;
}

// User Follow
export interface UserFollow {
    id: number;
    follower_id: number;
    following_id: number;
    created_at: string;
    follower?: User; // Optional populated user data
    following?: User; // Optional populated user data
}

// Review
export interface Review {
    id: number;
    user_id: number;
    media_id: number;
    rating: number | null; // 0-10
    title: string | null;
    content: string;
    likes_count: number;
    created_at: string;
    updated_at: string;
    user?: User; // Optional populated user data
    media?: Media; // Optional populated media data
}

// Review Like
export interface ReviewLike {
    id: number;
    user_id: number;
    review_id: number;
    created_at: string;
}

// User Activity
export interface UserActivity {
    id: number;
    user_id: number;
    media_id: number;
    activity_type: 'STARTED' | 'COMPLETED' | 'UPDATED_PROGRESS' | 'REVIEWED' | 'LIKED';
    details: string | null; // JSON string
    created_at: string;
    user?: User;
    media?: Media;

}

export interface UserActivityStats {
    reading: number;
    completed: number;
    favorites: number;
    followers: number;
}

// API Response types
export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    profile_picture: string | null;
    bio: string | null;
    created_at: string;
    followers_count?: number;
    following_count?: number;
}

// Request types
export interface SignupRequest {
    username: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface UpdateMediaListRequest {
    media_id: number;
    status: 'READING' | 'COMPLETED' | 'PLAN_TO_READ' | 'DROPPED' | 'ON_HOLD';
    score?: number;
    progress?: number;
    notes?: string;
}

export interface CreateReviewRequest {
    media_id: number;
    rating?: number;
    title?: string;
    content: string;
}

// Specialized type guards
export function isAnime(media: Media): boolean {
    return media.type === 'ANIME';
}

export function isManga(media: Media): boolean {
    return media.type === 'MANGA' || media.type === 'MANHWA' || media.type === 'MANHUA';
}

export function isManhwa(media: Media): boolean {
    return media.type === 'MANHWA' && media.country_of_origin === 'KR';
}

export function isManhua(media: Media): boolean {
    return media.type === 'MANHUA' && media.country_of_origin === 'CN';
}