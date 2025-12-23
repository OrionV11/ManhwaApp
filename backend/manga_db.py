import json
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Media
from datetime import datetime

def parse_year_to_date(year_released):
    """Convert year to a date object"""
    if not year_released:
        return None
    try:
        # If it's already a full date string
        if isinstance(year_released, str) and '-' in year_released:
            return datetime.strptime(year_released, '%Y-%m-%d').date()
        # If it's just a year
        year = int(year_released)
        return datetime(year, 1, 1).date()
    except (ValueError, TypeError):
        return None

def import_data():
    db = SessionLocal()
    
    try:
        # Load JSON data
        with open('anime_data.json', 'r', encoding='utf-8') as f:
            anime_data = json.load(f)
        
        with open('manga_data.json', 'r', encoding='utf-8') as f:
            manga_data = json.load(f)
        
        anime_success = 0
        anime_errors = 0
        
        # Insert anime data
        print("Importing anime data...")
        for anime in anime_data:
            try:
                # Check if media already exists
                existing = db.query(Media).filter(Media.id == anime['id']).first()
                
                # Parse the date
                start_date = parse_year_to_date(anime.get('year_released'))
                
                if existing:
                    # Update existing record
                    existing.title_english = anime.get('title_english')
                    existing.description = anime.get('description')
                    existing.average_score = anime.get('average_score')
                    existing.popularity = anime.get('popularity_rank', 0)
                    existing.episodes = anime.get('episodes')
                    existing.status = anime.get('status')
                    existing.start_date = start_date
                else:
                    # Create new record - map old fields to new schema
                    new_media = Media(
                        id=anime['id'],
                        title_romaji=anime.get('title_romaji', ''),
                        title_english=anime.get('title_english'),
                        title_native=None,
                        type='ANIME',
                        format=None,
                        status=anime.get('status'),
                        description=anime.get('description'),
                        start_date=start_date,
                        end_date=None,
                        chapters=None,
                        volumes=None,
                        episodes=anime.get('episodes'),
                        cover_image=anime.get('cover_image_url'),
                        banner_image=None,
                        genres=anime.get('genres', []),
                        tags=[],
                        average_score=anime.get('average_score'),
                        popularity=anime.get('popularity_rank', 0),
                        favorites=0,
                        source=anime.get('source'),
                        country_of_origin='JP'
                    )
                    db.add(new_media)
                
                anime_success += 1
                
                # Commit every 50 records to avoid memory issues
                if anime_success % 50 == 0:
                    db.commit()
                    print(f"Processed {anime_success} anime records...")
                    
            except Exception as e:
                anime_errors += 1
                print(f"Error inserting anime '{anime.get('title_romaji', 'Unknown')}': {e}")
                db.rollback()
        
        # Final commit for anime
        db.commit()
        print(f"\nAnime import complete: {anime_success} successful, {anime_errors} errors")
        
        manga_success = 0
        manga_errors = 0
        
        # Insert manga data
        print("\nImporting manga data...")
        for manga in manga_data:
            try:
                # Check if media already exists
                existing = db.query(Media).filter(Media.id == manga['id']).first()
                
                # Parse the date
                start_date = parse_year_to_date(manga.get('year_released'))
                
                if existing:
                    # Update existing record
                    existing.title_english = manga.get('title_english')
                    existing.description = manga.get('description')
                    existing.average_score = manga.get('average_score')
                    existing.popularity = manga.get('popularity_rank', 0)
                    existing.chapters = manga.get('chapters')
                    existing.status = manga.get('status')
                    existing.start_date = start_date
                else:
                    # Determine if it's MANGA, MANHWA, or MANHUA
                    media_type = 'MANGA'
                    country = 'JP'
                    
                    # Try to detect manhwa/manhua from genres or title
                    genres_lower = [g.lower() for g in manga.get('genres', [])]
                    if 'manhwa' in genres_lower or manga.get('source', '').lower() == 'manhwa':
                        media_type = 'MANHWA'
                        country = 'KR'
                    elif 'manhua' in genres_lower or manga.get('source', '').lower() == 'manhua':
                        media_type = 'MANHUA'
                        country = 'CN'
                    
                    # Create new record
                    new_media = Media(
                        id=manga['id'],
                        title_romaji=manga.get('title_romaji', ''),
                        title_english=manga.get('title_english'),
                        title_native=None,
                        type=media_type,
                        format='MANGA',
                        status=manga.get('status'),
                        description=manga.get('description'),
                        start_date=start_date,
                        end_date=None,
                        chapters=manga.get('chapters'),
                        volumes=None,
                        episodes=None,
                        cover_image=manga.get('cover_image_url'),
                        banner_image=None,
                        genres=manga.get('genres', []),
                        tags=[],
                        average_score=manga.get('average_score'),
                        popularity=manga.get('popularity_rank', 0),
                        favorites=0,
                        source=manga.get('source'),
                        country_of_origin=country
                    )
                    db.add(new_media)
                
                manga_success += 1
                
                # Commit every 50 records
                if manga_success % 50 == 0:
                    db.commit()
                    print(f"Processed {manga_success} manga records...")
                    
            except Exception as e:
                manga_errors += 1
                print(f"Error inserting manga '{manga.get('title_romaji', 'Unknown')}': {e}")
                db.rollback()
        
        # Final commit for manga
        db.commit()
        print(f"\nManga import complete: {manga_success} successful, {manga_errors} errors")
        
        # Print summary
        print(f"\n{'='*50}")
        print(f"IMPORT SUMMARY")
        print(f"{'='*50}")
        print(f"Anime: {anime_success}/{len(anime_data)} successful ({anime_errors} errors)")
        print(f"Manga: {manga_success}/{len(manga_data)} successful ({manga_errors} errors)")
        print(f"Total: {anime_success + manga_success} records imported")
        
        # Check dates
        with_dates = db.query(Media).filter(Media.start_date.isnot(None)).count()
        print(f"Records with dates: {with_dates}")
        
    except FileNotFoundError as e:
        print(f"Error: Could not find data files - {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format - {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_data()