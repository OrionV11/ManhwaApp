import requests
import json
import time
from typing import Optional, List, Dict

class MALDataFetcher:
    """
    Fetch anime/manga data from MyAnimeList API (Jikan v4)
    Jikan is an unofficial MAL API that doesn't require authentication
    """

    def __init__(self):
        self.base_url = "https://api.jikan.moe/v4"
        self.rate_limit_delay = 1  # Jikan has rate limits (1 request per second)

    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make API request with error handling and rate limiting"""
        url = f"{self.base_url}/{endpoint}"

        try:
            response = requests.get(url, params=params, timeout=10)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:  # Rate limited
                print("Rate limited. Waiting 3 seconds...")
                time.sleep(3)
                return self._make_request(endpoint, params)
            else:
                print(f"Error: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        finally:
            time.sleep(self.rate_limit_delay)

    def search_anime(self, query: str, limit: int = 25) -> List[Dict]:
        """Search for anime by title"""
        data = self._make_request("anime", params={
            "q": query,
            "limit": limit,
            "order_by": "score",
            "sort": "desc"
        })

        return data.get("data", []) if data else []

    def search_manga(self, query: str, limit: int = 25) -> List[Dict]:
        """Search for manga by title"""
        data = self._make_request("manga", params={
            "q": query,
            "limit": limit,
            "order_by": "score",
            "sort": "desc"
        })

        return data.get("data", []) if data else []

    def get_anime_by_id(self, anime_id: int) -> Optional[Dict]:
        """Get detailed anime information by ID"""
        return self._make_request(f"anime/{anime_id}")

    def get_manga_by_id(self, manga_id: int) -> Optional[Dict]:
        """Get detailed manga information by ID"""
        return self._make_request(f"manga/{manga_id}")

    def get_top_anime(self, page: int = 1, limit: int = 25) -> List[Dict]:
        """Get top anime by score"""
        data = self._make_request("top/anime", params={
            "page": page,
            "limit": limit
        })

        return data.get("data", []) if data else []

    def get_top_manga(self, page: int = 1, limit: int = 25) -> List[Dict]:
        """Get top manga by score"""
        data = self._make_request("top/manga", params={
            "page": page,
            "limit": limit
        })

        return data.get("data", []) if data else []

    def get_seasonal_anime(self, year: int, season: str) -> List[Dict]:
        """
        Get seasonal anime
        season: 'winter', 'spring', 'summer', 'fall'
        """
        data = self._make_request(f"seasons/{year}/{season}")
        return data.get("data", []) if data else []

    def get_current_season(self) -> List[Dict]:
        """Get currently airing anime"""
        data = self._make_request("seasons/now")
        return data.get("data", []) if data else []

    def fetch_popular_anime(self, num_pages: int = 5) -> List[Dict]:
        """Fetch multiple pages of top anime"""
        all_anime = []

        for page in range(1, num_pages + 1):
            print(f"Fetching anime page {page}...")
            anime = self.get_top_anime(page=page, limit=25)
            all_anime.extend(anime)

        return all_anime

    def fetch_popular_manga(self, num_pages: int = 5) -> List[Dict]:
        """Fetch multiple pages of top manga"""
        all_manga = []

        for page in range(1, num_pages + 1):
            print(f"Fetching manga page {page}...")
            manga = self.get_top_manga(page=page, limit=25)
            all_manga.extend(manga)

        return all_manga

    def transform_to_db_format(self, item: Dict, media_type: str) -> Dict:
        """Transform MAL data to match our database schema"""
        genres = [g["name"] for g in item.get("genres", [])]

        return {
            "id": item["mal_id"],
            "type": media_type.upper(),
            "title_romaji": item.get("title", ""),
            "title_english": item.get("title_english"),
            "description": item.get("synopsis"),
            "cover_image_url": item.get("images", {}).get("jpg", {}).get("large_image_url"),
            "banner_image_url": item.get("images", {}).get("jpg", {}).get("image_url"),
            "genres": genres,
            "average_score": item.get("score"),
            "popularity_rank": item.get("popularity"),
            "mal_id": item["mal_id"],
            "episodes": item.get("episodes") if media_type == "anime" else None,
            "chapters": item.get("chapters") if media_type == "manga" else None,
            "status": item.get("status", "").upper().replace(" ", "_"),
            "year_released": item.get("year") or (item.get("aired", {}).get("prop", {}).get("from", {}).get("year") if media_type == "anime" else item.get("published", {}).get("prop", {}).get("from", {}).get("year")),
            "season": item.get("season", "") if media_type == "anime" else None,
            "source": item.get("source")
        }

    def save_to_json(self, data: List[Dict], filename: str):
        """Save data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(data)} items to {filename}")

# Load        anime['average_score'], anime['popularity_rank'], ani
# ============================================
# Example Usage
# ============================================
if __name__ == "__main__":
    fetcher = MALDataFetcher()

    # Example 1: Search for specific anime
    print("Searching for 'Attack on Titan'...")
    results = fetcher.search_anime("Attack on Titan", limit=5)
    for anime in results:
        print(f"- {anime['title']} (Score: {anime.get('score', 'N/A')})")

    print("\n" + "="*50 + "\n")

    # Example 2: Get top anime
    print("Fetching top 10 anime...")
    top_anime = fetcher.get_top_anime(page=1, limit=10)
    for i, anime in enumerate(top_anime, 1):
        print(f"{i}. {anime['title']} - Score: {anime.get('score', 'N/A')}")

    print("\n" + "="*50 + "\n")

    # Example 3: Fetch and transform data for database
    print("Fetching popular anime for database...")
    anime_list = fetcher.fetch_popular_anime(num_pages=2)  # Fetch 50 anime
    transformed_anime = [fetcher.transform_to_db_format(a, "anime") for a in anime_list]
    fetcher.save_to_json(transformed_anime, "anime_data.json")

    print("\n" + "="*50 + "\n")

    # Example 4: Fetch manga
    print("Fetching popular manga for database...")
    manga_list = fetcher.fetch_popular_manga(num_pages=2)  # Fetch 50 manga
    transformed_manga = [fetcher.transform_to_db_format(m, "manga") for m in manga_list]
    fetcher.save_to_json(transformed_manga, "manga_data.json")

    print("\nDone! Data saved to anime_data.json and manga_data.json")