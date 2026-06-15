# anilist_db.py
import json
from database import SessionLocal
from models import Media
from datetime import datetime

def clean_integer(value):
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def parse_year_to_date(year):
    if not year:
        return None
    try:
        return datetime(int(year), 1, 1).date()
    except (ValueError, TypeError):
        return None

def import_anilist():
    db = SessionLocal()
    success = 0
    errors = 0
    skipped = 0

    try:
        with open('anilist_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        print(f"Importing {len(data)} AniList records...")

        for item in data:
            try:
                existing = db.query(Media).filter(Media.id == item['id']).first()
                start_date = parse_year_to_date(item.get('year_released'))

                if existing:
                    # Update score and popularity if AniList has better data
                    if item.get('average_score'):
                        existing.average_score = item.get('average_score')
                    if item.get('popularity'):
                        existing.popularity = item.get('popularity')
                    skipped += 1
                else:
                    new_media = Media(
                        id=item['id'],
                        title_romaji=item.get('title_romaji', ''),
                        title_english=item.get('title_english'),
                        title_native=item.get('title_native'),
                        type='MANHWA',
                        format=item.get('format', 'MANGA'),
                        status=item.get('status'),
                        description=item.get('description'),
                        start_date=start_date,
                        end_date=None,
                        chapters=clean_integer(item.get('chapters')),
                        volumes=clean_integer(item.get('volumes')),
                        episodes=None,
                        cover_image=item.get('cover_image_url'),
                        banner_image=item.get('banner_image_url'),
                        genres=item.get('genres', []),
                        tags=item.get('tags', []),
                        average_score=item.get('average_score'),
                        popularity=item.get('popularity', 0),
                        favorites=item.get('favorites', 0),
                        source='ANILIST',
                        country_of_origin='KR'
                    )
                    db.add(new_media)
                    success += 1

                if (success + skipped) % 50 == 0:
                    db.commit()
                    print(f"Processed {success + skipped} records...")

            except Exception as e:
                errors += 1
                print(f"Error inserting '{item.get('title_romaji', 'Unknown')}': {e}")
                db.rollback()

        db.commit()
        print(f"\nDone: {success} new, {skipped} updated, {errors} errors")

    except Exception as e:
        print(f"Fatal error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_anilist()
