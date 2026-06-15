# anilist_fetcher.py
import requests
import json
import time
from typing import Optional, List, Dict
import hashlib

def clean_integer(value):
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def uuid_to_int(unique_str: str) -> int:
    return int(hashlib.md5(unique_str.encode()).hexdigest()[:7], 16)

class AniListFetcher:
    def __init__(self):
        self.url = "https://graphql.anilist.co"
        self.rate_limit_delay = 1

    def _make_request(self, query: str, variables: dict) -> Optional[Dict]:
        try:
            response = requests.post(
                self.url,
                json={"query": query, "variables": variables},
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                print("Rate limited. Waiting 60 seconds...")
                time.sleep(60)
                return self._make_request(query, variables)
            else:
                print(f"Error: {response.status_code} - {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        finally:
            time.sleep(self.rate_limit_delay)

    def get_manhwa(self, page: int = 1, per_page: int = 50) -> Dict:
        """Fetch manhwa from AniList using GraphQL"""
        query = """
        query ($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    total
                    currentPage
                    lastPage
                    hasNextPage
                }
                media(
                    countryOfOrigin: KR
                    type: MANGA
                    sort: POPULARITY_DESC
                ) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    description
                    status
                    startDate {
                        year
                    }
                    endDate {
                        year
                    }
                    chapters
                    volumes
                    coverImage {
                        large
                    }
                    bannerImage
                    genres
                    tags {
                        name
                    }
                    averageScore
                    popularity
                    favourites
                    source
                    countryOfOrigin
                    format
                }
            }
        }
        """
        variables = {"page": page, "perPage": per_page}
        return self._make_request(query, variables)

    def transform_to_db_format(self, item: Dict) -> Dict:
        """Transform AniList data to match database schema"""
        # Generate integer ID from AniList ID
        anilist_id = item.get("id", 0)
        int_id = uuid_to_int(f"anilist_{anilist_id}")

        # Extract titles
        titles = item.get("title", {})
        title_en = titles.get("english") or titles.get("romaji", "")
        title_romaji = titles.get("romaji", "")
        title_native = titles.get("native")

        # Extract genres and tags
        genres = item.get("genres", [])
        tags = [t["name"] for t in item.get("tags", [])]

        # Map status
        status_map = {
            "FINISHED": "FINISHED",
            "RELEASING": "RELEASING",
            "NOT_YET_RELEASED": "NOT_YET_RELEASED",
            "CANCELLED": "CANCELLED",
            "HIATUS": "HIATUS"
        }
        status = status_map.get(item.get("status", ""), "UNKNOWN")

        # Extract year
        year = item.get("startDate", {}).get("year") if item.get("startDate") else None

        # Average score (AniList uses 0-100, convert to 0-10)
        avg_score = item.get("averageScore")
        if avg_score:
            avg_score = round(avg_score / 10, 1)

        return {
            "id": int_id,
            "title_romaji": title_romaji,
            "title_english": title_en,
            "title_native": title_native,
            "type": "MANHWA",
            "format": item.get("format", "MANGA"),
            "status": status,
            "description": item.get("description"),
            "cover_image_url": item.get("coverImage", {}).get("large"),
            "banner_image_url": item.get("bannerImage"),
            "genres": genres,
            "tags": tags,
            "average_score": avg_score,
            "popularity": item.get("popularity", 0),
            "favorites": item.get("favourites", 0),
            "chapters": clean_integer(item.get("chapters")),
            "volumes": clean_integer(item.get("volumes")),
            "year_released": year,
            "country_of_origin": "KR",
            "source": "ANILIST"
        }

    def fetch_all_manhwa(self, total: int = 1000) -> List[Dict]:
        """Fetch manhwa with pagination"""
        all_manhwa = []
        page = 1
        per_page = 50

        while len(all_manhwa) < total:
            print(f"Fetching page {page}...")
            data = self.get_manhwa(page=page, per_page=per_page)

            if not data:
                print("No data returned")
                break

            page_data = data.get("data", {}).get("Page", {})
            media_list = page_data.get("media", [])

            if not media_list:
                print("No more results")
                break

            all_manhwa.extend(media_list)
            print(f"Total fetched: {len(all_manhwa)}")

            if not page_data.get("pageInfo", {}).get("hasNextPage"):
                print("No more pages")
                break

            page += 1

        return all_manhwa[:total]

    def save_to_json(self, data: List[Dict], filename: str):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(data)} items to {filename}")


if __name__ == "__main__":
    fetcher = AniListFetcher()

    print("Fetching manhwa from AniList...")
    manhwa_list = fetcher.fetch_all_manhwa(total=1000)

    print("Transforming data...")
    transformed = [fetcher.transform_to_db_format(m) for m in manhwa_list]

    fetcher.save_to_json(transformed, "anilist_data.json")
    print(f"Done! {len(transformed)} manhwa saved to anilist_data.json")
