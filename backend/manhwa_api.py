import requests
import json
import time

url = 'https://graphql.anilist.co'

query = """
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(type: ANIME, sort: [POPULARITY_DESC]) {
      id
      title {
        romaji
        english
      }
      genres
      description
      averageScore
    }
  }
}
"""

def fetch_anime_data(page_num, max_retries=3):
    """Fetch anime data with retry logic"""
    for attempt in range(max_retries):
        try:
            variables = {'page': page_num, 'perPage': 50}
            response = requests.post(url, json={'query': query, 'variables': variables}, timeout=10)
            
            if response.status_code == 200:
                return response.json()['data']['Page']
            elif response.status_code == 429:  # Rate limited
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Rate limited. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise Exception(f"Query failed with status code {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"Request error on page {page_num}, attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                raise

def save_data(data, filename='anime_data.json'):
    """Save data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Data saved to {filename}")

# Fetch all anime data
all_anime_data = []
current_page = 1
has_next_page = True

try:
    while has_next_page:
        print(f"Fetching page {current_page}...")
        page_data = fetch_anime_data(current_page)
        all_anime_data.extend(page_data['media'])
        
        has_next_page = page_data['pageInfo']['hasNextPage']
        print(f"  Got {len(page_data['media'])} items. Total: {len(all_anime_data)}")
        
        current_page += 1
        time.sleep(0.5)  # Be nice to the API
        
except Exception as e:
    print(f"Error occurred: {e}")
finally:
    if all_anime_data:
        save_data(all_anime_data)
    print(f"Finished. Total anime entries: {len(all_anime_data)}")