CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media (
  id INTEGER PRIMARY KEY,  -- AniList ID to maintain consistency
  type VARCHAR(10) NOT NULL,  -- 'ANIME' or 'MANGA'
  title_romaji VARCHAR(255) NOT NULL,
  title_english VARCHAR(255),
  description TEXT,
  cover_image_url VARCHAR(500),
  banner_image_url VARCHAR(500),
  genres TEXT[],  -- Array of genre strings
  average_score DECIMAL(3,1),  -- 0-100
  popularity_rank INTEGER,
  mal_id INTEGER,  -- MyAnimeList ID for cross-reference
  anilist_url VARCHAR(500),
  episodes INTEGER,  -- For anime only
  chapters INTEGER,  -- For manga only
  status VARCHAR(20),  -- 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED'
  year_released INTEGER,
  season VARCHAR(10),  -- 'FALL', 'WINTER', 'SPRING', 'SUMMER' (anime)
  source VARCHAR(50),  -- 'MANGA', 'LIGHT_NOVEL', 'ORIGINAL', etc.
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast searching
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_title_romaji ON media(title_romaji);
CREATE INDEX idx_media_genres ON media USING GIN(genres);
CREATE INDEX idx_media_status ON media(status);

CREATE TABLE user_media_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,  -- 'WATCHING', 'COMPLETED', 'DROPPED', 'PAUSED', 'PLANNING'
  rating DECIMAL(2,1),  -- 0-10, nullable (can rate without review)
  review TEXT,
  episodes_watched INTEGER,  -- For anime
  chapters_read INTEGER,  -- For manga
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, media_id)  -- One entry per user per media
);

CREATE INDEX idx_user_media_entries_user ON user_media_entries(user_id);
CREATE INDEX idx_user_media_entries_media ON user_media_entries(media_id);
CREATE INDEX idx_user_media_entries_status ON user_media_entries(status);

CREATE TABLE user_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

CREATE TABLE user_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  position INTEGER,  -- For custom ordering
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(list_id, media_id)
);

CREATE INDEX idx_user_lists_user ON user_lists(user_id);
CREATE INDEX idx_user_list_items_list ON user_list_items(list_id);

CREATE TABLE user_follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE review_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES user_media_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, entry_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_review_likes_entry ON review_likes(entry_id);

SELECT * FROM media
WHERE type = 'ANIME'
  AND (title_romaji ILIKE '%search_term%' 
       OR title_english ILIKE '%search_term%')
  AND genres @> ARRAY['Action', 'Adventure']
ORDER BY average_score DESC
LIMIT 20;

SELECT 
  m.*,
  ume.status,
  ume.rating,
  ume.episodes_watched
FROM user_media_entries ume
JOIN media m ON ume.media_id = m.id
WHERE ume.user_id = $1
  AND ume.status = 'WATCHING'
ORDER BY ume.updated_at DESC;

SELECT 
  m.*,
  COUNT(ume.id) as total_entries,
  AVG(ume.rating) as avg_user_rating
FROM media m
LEFT JOIN user_media_entries ume ON m.id = ume.media_id
WHERE ume.created_at > NOW() - INTERVAL '7 days'
GROUP BY m.id
ORDER BY total_entries DESC
LIMIT 20;

-- Upsert example (on your backend)
INSERT INTO media (id, type, title_romaji, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (id) DO UPDATE SET
  title_english = $4,
  average_score = $5,
  last_synced_at = CURRENT_TIMESTAMP;