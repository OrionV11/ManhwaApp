import hashlib
import json
from database import SessionLocal
from models import Media
from datetime import datetime

def parse_year_to_date(year):
    if not year:
        return None
    try:
        return datetime(int(year), 1, 1).date()
    except (ValueError, TypeError):
        return None

def clean_integer(value):
    """Convert empty strings to None for integer fields"""
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def uuid_to_int(uuid_str: str) -> int:
    """Convert UUID to integer within PostgreSQL integer range"""
    return int(hashlib.md5(uuid_str.encode()).hexdigest()[:7], 16)

def import_manhwa():
    db = SessionLocal()
    success = 0
    errors = 0

    try:
        with open('manhwa_data.json', 'r', encoding='utf-8') as f:
            manhwa_data = json.load(f)

        print(f"Importing {len(manhwa_data)} manhwa records...")

        for manhwa in manhwa_data:
            try:
                existing = db.query(Media).filter(Media.id == manhwa['id']).first()
                start_date = parse_year_to_date(manhwa.get('year_released'))

                if existing:
                    existing.title_english = manhwa.get('title_english')
                    existing.description = manhwa.get('description')
                    existing.cover_image = manhwa.get('cover_image_url')
                    existing.status = manhwa.get('status')
                    existing.start_date = start_date
                else:
                    new_media = Media(
                        id=manhwa['id'],
                        title_romaji=manhwa.get('title_romaji', ''),
                        title_english=manhwa.get('title_english'),
                        title_native=manhwa.get('title_native'),
                        type='MANHWA',
                        format='MANGA',
                        status=manhwa.get('status'),
                        description=manhwa.get('description'),
                        start_date=start_date,
                        end_date=None,
                        chapters=clean_integer(manhwa.get('chapters')),
                        volumes=None,
                        episodes=None,
                        cover_image=manhwa.get('cover_image_url'),
                        banner_image=None,
                        genres=manhwa.get('genres', []),
                        tags=[],
                        average_score=None,
                        popularity=0,
                        favorites=0,
                        source='MANGADEX',
                        country_of_origin='KR'
                    )
                    db.add(new_media)

                success += 1

                if success % 50 == 0:
                    db.commit()
                    print(f"Processed {success} records...")

            except Exception as e:
                errors += 1
                print(f"Error inserting '{manhwa.get('title_romaji', 'Unknown')}': {e}")
                db.rollback()

        db.commit()
        print(f"\nDone: {success} successful, {errors} errors")

    except Exception as e:
        print(f"Fatal error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_manhwa()
