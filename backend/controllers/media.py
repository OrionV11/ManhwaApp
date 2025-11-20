from config.database import query_db

def search_media(query: str, type: str = None, genre: str = None):
    """Search for anime/manga"""
    sql = """
        SELECT * FROM media
        WHERE (title_romaji ILIKE %s OR title_english ILIKE %s)
    """
    params = [f"%{query}%", f"%{query}%"]

    if type:
        sql += " AND type = %s"
        params.append(type.upper())

    if genre:
        sql += " AND %s = ANY(genres)"
        params.append(genre)

    sql += " ORDER BY average_score DESC LIMIT 50"

    results = query_db(sql, tuple(params))
    return results

def get_media_by_id(media_id: int):
    """Get media details"""
    results = query_db("SELECT * FROM media WHERE id = %s", (media_id,))
    if not results:
        raise ValueError("Media not found")
    return results[0]

def get_trending_media():
    """Get trending media from last 7 days"""
    sql = """
        SELECT 
            m.*,
            COUNT(ume.id) as total_entries,
            AVG(ume.rating) as avg_user_rating
        FROM media m
        LEFT JOIN user_media_entries ume ON m.id = ume.media_id
        WHERE ume.created_at > NOW() - INTERVAL '7 days'
        GROUP BY m.id
        ORDER BY total_entries DESC
        LIMIT 20
    """
    results = query_db(sql)
    return results

