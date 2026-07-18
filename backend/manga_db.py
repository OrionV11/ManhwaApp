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
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def import_data(filename, media_type):
    """Import either MANHWA or ANIME data"""
    db = SessionLocal()
    success = 0
    errors = 0

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)

        print(f"\n📖 Importing {len(data)} {media_type} records from {filename}...")

        for item in data:
            try:
                item_id = item.get('id')
                existing = db.query(Media).filter(Media.id == item_id).first()
                start_date = parse_year_to_date(item.get('year_released'))

                if existing:
                    print(f"  ⏭ Skipping {item.get('title_romaji', 'Unknown')} (already exists)")
                    success += 1
                else:
                    new_media = Media(
                        id=item_id,
                        title_romaji=item.get('title_romaji', ''),
                        title_english=item.get('title_english'),
                        title_native=item.get('title_native'),
                        type=media_type,
                        format=item.get('format', 'MANGA' if media_type == 'MANHWA' else 'ANIME'),
                        status=item.get('status'),
                        description=item.get('description'),
                        start_date=start_date,
                        end_date=None,
                        chapters=clean_integer(item.get('chapters')),
                        volumes=clean_integer(item.get('volumes')),
                        episodes=clean_integer(item.get('episodes')),
                        cover_image=item.get('cover_image_url'),
                        banner_image=None,
                        genres=item.get('genres', []),
                        tags=item.get('tags', []),
                        average_score=item.get('average_score'),
                        popularity=item.get('popularity', 0),
                        favorites=item.get('favorites', 0),
                        source='ANILIST',
                        country_of_origin='KR' if media_type == 'MANHWA' else 'JP'
                    )
                    db.add(new_media)
                    success += 1

                if success % 100 == 0:
                    db.commit()
                    print(f"  ✓ Processed {success} {media_type} records...")

            except Exception as e:
                errors += 1
                print(f"  ❌ Error: {item.get('title_romaji', 'Unknown')}: {str(e)[:80]}")
                db.rollback()

        db.commit()
        print(f"\n✅ {media_type}: {success} added, {errors} errors")
        return success, errors

    except FileNotFoundError:
        print(f"❌ File not found: {filename}")
        return 0, len(data)
    except Exception as e:
        print(f"❌ Fatal error in {filename}: {e}")
        db.rollback()
        return 0, 1
    finally:
        db.close()

if __name__ == "__main__":
    total_success = 0
    total_errors = 0

    print("=" * 50)
    print("🚀 Starting database import...")
    print("=" * 50)

    # Import both
    success, errors = import_data('manhwa_data.json', 'MANHWA')
    total_success += success
    total_errors += errors

    success, errors = import_data('anime_data.json', 'ANIME')
    total_success += success
    total_errors += errors

    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"  Total added: {total_success}")
    print(f"  Total errors: {total_errors}")
    print("=" * 50)