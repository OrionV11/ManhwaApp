import requests
import time
import json
import hashlib
from typing import Optional, List, Dict

def clean_integer(value):
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def uuid_to_int(uuid_str: str) -> int:
    """Convert UUID to integer within PostgreSQL integer range"""
    return int(hashlib.md5(uuid_str.encode()).hexdigest()[:7], 16)

class MangaDexFetcher:
    def __init__(self):
        self.base_url = "https://api.mangadex.org"
        self.rate_limit_delay = 0.5

    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                print("Rate limited. Waiting 5 seconds...")
                time.sleep(5)
                return self._make_request(endpoint, params)
            else:
                print(f"Error: {response.status_code}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        finally:
            time.sleep(self.rate_limit_delay)

    def get_cover_url(self, manga_id: str, cover_filename: str) -> str:
        return f"https://uploads.mangadex.org/covers/{manga_id}/{cover_filename}"

    def get_manhwa(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        data = self._make_request("manga", params={
            "originalLanguage[]": "ko",
            "limit": limit,
            "offset": offset,
            "order[followedCount]": "desc",
            "includes[]": "cover_art",
            "availableTranslatedLanguage[]": "en"
        })
        return data.get("data", []) if data else []

    def transform_to_db_format(self, item: Dict) -> Dict:
        attributes = item.get("attributes", {})

        uuid_str = item["id"]
        int_id = uuid_to_int(uuid_str)

        title_en = attributes.get("title", {}).get("en", "")
        title_ko = attributes.get("title", {}).get("ko", "")
        description = attributes.get("description", {}).get("en", "")

        tags = [
            tag["attributes"]["name"]["en"]
            for tag in attributes.get("tags", [])
            if "en" in tag.get("attributes", {}).get("name", {})
        ]

        cover_url = None
        for relationship in item.get("relationships", []):
            if relationship["type"] == "cover_art":
                filename = relationship.get("attributes", {}).get("fileName", "")
                if filename:
                    cover_url = self.get_cover_url(uuid_str, filename)

        status_map = {
            "ongoing": "RELEASING",
            "completed": "FINISHED",
            "hiatus": "HIATUS",
            "cancelled": "CANCELLED"
        }
        status = status_map.get(attributes.get("status", ""), "UNKNOWN")

        return {
            "id": int_id,
            "title_romaji": title_en or title_ko,
            "title_english": title_en,
            "title_native": title_ko,
            "type": "MANHWA",
            "format": "MANGA",
            "status": status,
            "description": description,
            "cover_image_url": cover_url,
            "genres": tags,
            "year_released": attributes.get("year"),
            "chapters": clean_integer(attributes.get("lastChapter")),
            "country_of_origin": "KR",
            "source": "MANGADEX"
        }

    def fetch_all_manhwa(self, total: int = 500) -> List[Dict]:
        all_manhwa = []
        offset = 0
        batch_size = 100

        while len(all_manhwa) < total:
            print(f"Fetching manhwa {offset} to {offset + batch_size}...")
            batch = self.get_manhwa(limit=batch_size, offset=offset)

            if not batch:
                print("No more results")
                break

            all_manhwa.extend(batch)
            offset += batch_size
            print(f"Total fetched: {len(all_manhwa)}")

        return all_manhwa[:total]

    def save_to_json(self, data: List[Dict], filename: str):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(data)} items to {filename}")


if __name__ == "__main__":
    fetcher = MangaDexFetcher()

    print("Fetching manhwa from MangaDex...")
    manhwa_list = fetcher.fetch_all_manhwa(total=500)

    print("Transforming data...")
    transformed = [fetcher.transform_to_db_format(m) for m in manhwa_list]

    fetcher.save_to_json(transformed, "manhwa_data.json")
    print(f"Done! {len(transformed)} manhwa saved to manhwa_data.json")
