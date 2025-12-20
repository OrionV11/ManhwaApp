import json
from config.database import execute_db

# Load JSON data
with open('anime_data.json', 'r', encoding='utf-8') as f:
    anime_data = json.load(f)

with open('manga_data.json', 'r', encoding='utf-8') as f:
    manga_data = json.load(f)


success_count = 0
# Insert into database
for anime in anime_data:
    try:
        execute_db("""
            INSERT INTO media (id, type, title_romaji, title_english, description, 
                              cover_image_url, genres, average_score, popularity_rank, 
                              mal_id, episodes, status, year_released, season, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                title_english = EXCLUDED.title_english,
                description = EXCLUDED.description,
                average_score = EXCLUDED.average_score,
                last_synced_at = CURRENT_TIMESTAMP
        """, (
            anime['id'], anime['type'], anime['title_romaji'], anime['title_english'],
            anime['description'], anime['cover_image_url'], anime['genres'],
            anime['average_score'], anime['popularity_rank'], anime['mal_id'],
            anime['episodes'], anime['status'], anime['year_released'],
            anime['season'], anime['source']
        ))
        success_count += 1
    
    except Exception as e:
        # Only print real errors, not "no results to fetch"
        if "no results to fetch" not in str(e):
            print(f"Error inserting anime {anime.get('title_romaji', 'Unknown')}: {e}")

    for manga in manga_data:
        try:
            execute_db("""
                INSERT INTO media (id, type, title_romaji, title_english, description, 
                                  cover_image_url, genres, average_score, popularity_rank, 
                                  mal_id, chapters, status, year_released, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET      
                    title_english = EXCLUDED.title_english,
                    description = EXCLUDED.description,
                    average_score = EXCLUDED.average_score,
                    last_synced_at = CURRENT_TIMESTAMP
            """, (
                manga['id'], manga['type'], manga['title_romaji'], manga['title_english'],
                manga['description'], manga['cover_image_url'], manga['genres'],
                manga['average_score'], manga['popularity_rank'], manga['mal_id'],
                manga['chapters'], manga['status'], manga['year_released'],
                manga['source']
            ))
            success_count += 1
        
        except Exception as e:
        # Only print real errors, not "no results to fetch"
            if "no results to fetch" not in str(e):
                print(f"Error inserting anime {manga.get('title_romaji', 'Unknown')}: {e}")

print(f"Successfully processed {success_count}/{len(anime_data)} anime records")
print(f"Successfully processed {success_count}/{len(manga_data)} manga records")
