import requests
import sqlite3
import time
import json
import os

# Force requests to use system certificates
os.environ['REQUESTS_CA_BUNDLE'] = '/etc/ssl/certs/ca-certificates.crt'
os.environ['CURL_CA_BUNDLE'] = '/etc/ssl/certs/ca-certificates.crt'

def init_db():
    conn = sqlite3.connect('manhwa_db.db')  # Changed from manhwa.db
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS manhwa
                 (id INTEGER PRIMARY KEY,
                  title_romaji TEXT,
                  title_english TEXT,
                  title_native TEXT,
                  cover_url TEXT,
                  description TEXT,
                  genres TEXT,
                  chapters INTEGER,
                  volumes INTEGER,
                  status TEXT,
                  format TEXT,
                  country_of_origin TEXT,
                  average_score REAL,
                  popularity INTEGER,
                  start_date TEXT,
                  anilist_url TEXT UNIQUE)''')
    conn.commit()
    return conn

def fetch_manhwa_anilist(page=1, per_page=50, format_type="MANGA", country="KR"):
    """
    Fetch manhwa/manga from AniList
    format_type: MANGA, NOVEL, ONE_SHOT
    country: JP (manga), KR (manhwa), CN (manhua)
    """
    url = 'https://graphql.anilist.co'

    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    
    query = '''
    query ($page: Int, $perPage: Int, $format: MediaFormat, $countryOfOrigin: CountryCode) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(format: $format, type: MANGA, countryOfOrigin: $countryOfOrigin, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
          }
          description
          genres
          chapters
          volumes
          status
          format
          countryOfOrigin
          averageScore
          popularity
          startDate {
            year
            month
            day
          }
          siteUrl
        }
      }
    }
    '''
    
    variables = {
        'page': page,
        'perPage': per_page,
        'format': format_type,
        'countryOfOrigin': country
    }
    
    response = requests.post(url, json={'query': query, 'variables': variables}, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def save_to_db(conn, media):
    c = conn.cursor()
    try:
        # Format start date
        start_date = None
        if media['startDate']['year']:
            start_date = f"{media['startDate']['year']}-{media['startDate'].get('month', 1):02d}-{media['startDate'].get('day', 1):02d}"
        
        c.execute('''INSERT OR REPLACE INTO manhwa 
                     (id, title_romaji, title_english, title_native, cover_url, description, 
                      genres, chapters, volumes, status, format, country_of_origin, 
                      average_score, popularity, start_date, anilist_url)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (media['id'],
                   media['title']['romaji'],
                   media['title'].get('english'),
                   media['title'].get('native'),
                   media['coverImage']['extraLarge'],
                   media.get('description', ''),
                   ', '.join(media.get('genres', [])),
                   media.get('chapters'),
                   media.get('volumes'),
                   media.get('status'),
                   media.get('format'),
                   media.get('countryOfOrigin'),
                   media.get('averageScore'),
                   media.get('popularity'),
                   start_date,
                   media['siteUrl']))
        conn.commit()
        print(f"✓ Saved: {media['title']['romaji']}")
    except Exception as e:
        print(f"✗ Error saving {media['title']['romaji']}: {e}")

def scrape_all_manhwa(conn, country="KR", max_retries=3):
    """
    Scrape all manhwa/manga from a specific country
    KR = Manhwa, JP = Manga, CN = Manhua
    """
    page = 1
    has_next_page = True
    
    while has_next_page:
        print(f"\n📖 Fetching page {page}...")
        
        # Retry logic for rate limiting
        for attempt in range(max_retries):
            result = fetch_manhwa_anilist(page=page, per_page=50, country=country)
            
            if result and 'data' in result:
                page_info = result['data']['Page']['pageInfo']
                media_list = result['data']['Page']['media']
                
                print(f"Found {len(media_list)} items on page {page}/{page_info['lastPage']}")
                
                for media in media_list:
                    save_to_db(conn, media)
                
                has_next_page = page_info['hasNextPage']
                page += 1
                
                # AniList rate limit: 90 requests per minute
                # Sleep for ~1.5 seconds to be safe (40 requests/min)
                time.sleep(1.5)
                break  # Success, exit retry loop
                
            elif result and 'errors' in result:
                # Check if it's a rate limit error
                if any(err.get('status') == 429 for err in result['errors']):
                    wait_time = (attempt + 1) * 30  # 30, 60, 90 seconds
                    print(f"⚠️  Rate limited! Waiting {wait_time} seconds before retry {attempt + 1}/{max_retries}...")
                    time.sleep(wait_time)
                else:
                    print(f"Error: {result['errors']}")
                    break
            else:
                print("No more results or error occurred")
                has_next_page = False
                break
        else:
            # All retries failed
            print("❌ Max retries reached. Stopping.")
            has_next_page = False
            break

def main():
    conn = init_db()
    
    print("Choose what to scrape:")
    print("1. Manhwa (Korean)")
    print("2. Manga (Japanese)")
    print("3. Manhua (Chinese)")
    print("4. All of the above")
    
    choice = input("Enter choice (1-4): ").strip()
    
    if choice == "1":
        scrape_all_manhwa(conn, country="KR")
    elif choice == "2":
        scrape_all_manhwa(conn, country="JP")
    elif choice == "3":
        scrape_all_manhwa(conn, country="CN")
    elif choice == "4":
        for country, name in [("KR", "Manhwa"), ("JP", "Manga"), ("CN", "Manhua")]:
            print(f"\n{'='*50}")
            print(f"Scraping {name}...")
            print(f"{'='*50}")
            scrape_all_manhwa(conn, country=country)
    else:
        print("Invalid choice")
    
    conn.close()
    print("\n✅ Done! Database saved to manhwa_db.db")

if __name__ == "__main__":
    main()