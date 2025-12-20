-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Manhwa/Media table
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    title_romaji VARCHAR(255) NOT NULL,
    title_english VARCHAR(255),
    title_native VARCHAR(255),
    type VARCHAR(20) NOT NULL, -- 'MANGA', 'MANHWA', 'MANHUA', 'ANIME'
    format VARCHAR(20), -- 'TV', 'MOVIE', 'OVA', 'SPECIAL', 'MANGA', 'ONE_SHOT'
    status VARCHAR(20), -- 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED'
    description TEXT,
    start_date DATE,
    end_date DATE,
    chapters INTEGER,
    volumes INTEGER,
    episodes INTEGER,
    cover_image VARCHAR(500),
    banner_image VARCHAR(500),
    genres TEXT[], -- PostgreSQL array for multiple genres
    tags TEXT[],
    average_score DECIMAL(4,2), -- e.g., 85.50
    popularity INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    source VARCHAR(50), -- 'ORIGINAL', 'MANGA', 'LIGHT_NOVEL', 'WEB_NOVEL', etc.
    country_of_origin VARCHAR(2), -- 'JP', 'KR', 'CN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User media lists (reading list, completed, plan to read, etc.)
CREATE TABLE user_media_lists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- 'READING', 'COMPLETED', 'PLAN_TO_READ', 'DROPPED', 'ON_HOLD'
    score DECIMAL(3,1), -- User's rating (0-10)
    progress INTEGER DEFAULT 0, -- Chapters/episodes read
    notes TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, media_id) -- A user can only have one entry per media
);

-- Likes/Favorites
CREATE TABLE media_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, media_id) -- A user can only like a media once
);

-- User followers system
CREATE TABLE user_follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User who is following
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User being followed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id), -- Can't follow the same user twice
    CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Reviews/Comments
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    rating DECIMAL(3,1), -- 0-10 rating
    title VARCHAR(255),
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review likes
CREATE TABLE review_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, review_id)
);

-- Reading history/activity
CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'STARTED', 'COMPLETED', 'UPDATED_PROGRESS', 'REVIEWED', 'LIKED'
    details JSONB, -- Flexible field for storing activity-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_status ON media(status);
CREATE INDEX idx_media_score ON media(average_score DESC);
CREATE INDEX idx_media_popularity ON media(popularity DESC);
CREATE INDEX idx_media_genres ON media USING GIN(genres); -- GIN index for array searches

CREATE INDEX idx_user_media_lists_user ON user_media_lists(user_id);
CREATE INDEX idx_user_media_lists_media ON user_media_lists(media_id);
CREATE INDEX idx_user_media_lists_status ON user_media_lists(status);

CREATE INDEX idx_media_likes_user ON media_likes(user_id);
CREATE INDEX idx_media_likes_media ON media_likes(media_id);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

CREATE INDEX idx_reviews_media ON reviews(media_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

CREATE INDEX idx_user_activity_user ON user_activity(user_id);
CREATE INDEX idx_user_activity_created ON user_activity(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_media_lists_updated_at BEFORE UPDATE ON user_media_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();