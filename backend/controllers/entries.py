from config.database import query_db, execute_db

def add_entry(user_id: str, media_id: int, status: str, rating: float = None, 
              review: str = None, episodes_watched: int = None):
    """Add or update user entry"""
    sql = """
        INSERT INTO user_media_entries 
        (user_id, media_id, status, rating, review, episodes_watched)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (user_id, media_id) DO UPDATE
        SET status = %s, rating = %s, review = %s, episodes_watched = %s, updated_at = CURRENT_TIMESTAMP
        RETURNING *
    """
    params = (user_id, media_id, status, rating, review, episodes_watched, 
              status, rating, review, episodes_watched)
    
    result = execute_db(sql, params)
    return result[0] if result else None

def get_user_entries(user_id: str, status: str = None):
    """Get user's entries"""
    sql = """
        SELECT m.*, ume.status, ume.rating, ume.review, ume.episodes_watched, ume.completed_at
        FROM user_media_entries ume
        JOIN media m ON ume.media_id = m.id
        WHERE ume.user_id = %s
    """
    params = [user_id]

    if status:
        sql += " AND ume.status = %s"
        params.append(status)

    sql += " ORDER BY ume.updated_at DESC"

    results = query_db(sql, tuple(params))
    return results

def delete_entry(user_id: str, media_id: int):
    """Delete user entry"""
    result = execute_db(
        "DELETE FROM user_media_entries WHERE user_id = %s AND media_id = %s RETURNING id",
        (user_id, media_id)
    )
    if not result:
        raise ValueError("Entry not found")
    return {"message": "Entry deleted"}
