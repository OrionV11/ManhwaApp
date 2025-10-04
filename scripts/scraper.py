import requests
import json
import sqlite3
import time
import os
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse


def init_db():
    """Initialize SQLite database with manhwa table"""
    conn = sqlite3.connect('manhwa.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS manhwa
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT,
                  cover_url TEXT,
                  description TEXT,
                  genre TEXT,
                  num_episodes INTEGER,
                  detail_url TEXT UNIQUE,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    return conn


def url_exists_in_db(conn, url):
    """Check if URL already exists in database"""
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM manhwa WHERE detail_url = ?', (url,))
    return c.fetchone()[0] > 0


def save_to_db(conn, data):
    """Save webtoon data to database"""
    c = conn.cursor()
    try:
        c.execute('''INSERT INTO manhwa (title, cover_url, description, genre, num_episodes, detail_url)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (data['title'], data['cover_url'], data['description'], 
                   data['genre'], data['num_episodes'], data['detail_url']))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        print(f"  ⚠️  Already exists: {data['title']}")
        return False
    except Exception as e:
        print(f"  ❌ Error saving to DB: {e}")
        return False


def get_webtoon_links(listing_url, session):
    """Extract webtoon detail links from a listing page"""
    try:
        response = session.get(listing_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        links = []
        # Look for card/thumbnail links in genre pages
        for a in soup.select('a[href]'):
            href = a.get('href')
            # Match webtoon detail page patterns
            if href and ('/list?title_no=' in href or '/viewer?title_no=' in href):
                # Ensure we're getting the list page, not viewer
                if '/list?title_no=' in href:
                    # Convert to absolute URL
                    full_url = urljoin(listing_url, href)
                    # Remove any extra parameters to normalize
                    if '&' in full_url:
                        full_url = full_url.split('&')[0]
                    links.append(full_url)
        
        return list(set(links))
    except Exception as e:
        print(f"Error fetching listing page {listing_url}: {e}")
        return []


def get_all_pages(base_genre_url, session, max_pages=None):
    """Scrape all pages of a genre listing"""
    page = 1
    all_links = []
    
    while True:
        if max_pages and page > max_pages:
            break
            
        # Add page parameter correctly (? if first param, & if additional)
        separator = '?' if '?' not in base_genre_url else '&'
        url = f"{base_genre_url}{separator}page={page}"
        print(f"Scraping page {page}...")
        links = get_webtoon_links(url, session)
        
        if not links:
            print(f"No more links found on page {page}")
            break
            
        all_links.extend(links)
        print(f"  Found {len(links)} webtoons on page {page}")
        page += 1
        time.sleep(1)  # Rate limiting
        
    return list(set(all_links))


def scrape_webtoon_detail(detail_url, session):
    """Scrape details from a webtoon detail page"""
    try:
        response = session.get(detail_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Title - try multiple selectors
        title = ''
        title_elem = (soup.find('h1', class_='subj') or 
                     soup.find('h1', class_='detail_title') or
                     soup.select_one('.detail_header h1') or
                     soup.find('h1'))
        if title_elem:
            title = title_elem.text.strip()
        
        # Cover image
        cover_url = ''
        cover_img = (soup.find('img', class_='detail_img') or
                    soup.find('img', class_='detail_body_cover') or
                    soup.select_one('.detail_header img') or
                    soup.select_one('.detail_body img'))
        if cover_img and cover_img.get('src'):
            cover_url = cover_img['src']
        
        # Description
        desc = ''
        desc_elem = (soup.find('p', class_='summary') or
                    soup.find('p', class_='detail_summary') or
                    soup.select_one('.summary'))
        if desc_elem:
            desc = desc_elem.text.strip()
        
        # Genre
        genre = ''
        genre_elem = (soup.find('h2', class_='genre') or
                     soup.find('span', class_='genre') or
                     soup.select_one('.genre'))
        if genre_elem:
            genre = genre_elem.text.strip()
        
        # Number of episodes - try multiple selectors
        episodes = (soup.select('ul#_listUl li') or
                   soup.select('li._episodeItem') or
                   soup.select('.detail_lst li'))
        num_episodes = len(episodes)
        
        return {
            'title': title or 'Unknown Title',
            'cover_url': cover_url,
            'description': desc,
            'genre': genre,
            'num_episodes': num_episodes,
            'detail_url': detail_url
        }
    except Exception as e:
        print(f"  ❌ Error scraping {detail_url}: {e}")
        return None


def main():
    """Main scraper function"""
    BASE_URL = "https://www.webtoons.com"
    DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    # Initialize database
    conn = init_db()
    
    # Create a session for connection pooling
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    # Example genres to scrape
    genres = [
        '/en/genres/fantasy',
        '/en/genres/action',
        '/en/genres/romance',
    ]
    
    for genre_path in genres:
        genre_url = BASE_URL + genre_path
        print(f"\n{'='*60}")
        print(f"Scraping genre: {genre_path}")
        print(f"{'='*60}")
        
        # Debug: Save first page HTML if DEBUG is enabled
        if DEBUG:
            try:
                response = session.get(genre_url)
                with open(f'debug_{genre_path.split("/")[-1]}.html', 'w', encoding='utf-8') as f:
                    f.write(response.text)
                print(f"Debug: Saved HTML to debug_{genre_path.split('/')[-1]}.html")
            except Exception as e:
                print(f"Debug error: {e}")
        
        # Get all webtoon links (limit to 3 pages for demo)
        webtoon_links = get_all_pages(genre_url, session, max_pages=3)
        print(f"\nTotal unique webtoons found: {len(webtoon_links)}")
        
        # Scrape each webtoon
        saved_count = 0
        skipped_count = 0
        
        for i, link in enumerate(webtoon_links, 1):
            print(f"\n[{i}/{len(webtoon_links)}] Processing: {link}")
            
            # Skip if already in database
            if url_exists_in_db(conn, link):
                print("  ⏭️  Already in database, skipping...")
                skipped_count += 1
                continue
            
            # Scrape details
            data = scrape_webtoon_detail(link, session)
            if data:
                print(f"  ✓ Title: {data['title']}")
                print(f"  ✓ Genre: {data['genre']}")
                print(f"  ✓ Episodes: {data['num_episodes']}")
                if save_to_db(conn, data):
                    saved_count += 1
            
            time.sleep(1)  
        
        print(f"\n{'='*60}")
        print(f"Genre complete: {saved_count} saved, {skipped_count} skipped")
        print(f"{'='*60}")
    
    conn.close()
    print("\n✅ Scraping complete!")


if __name__ == "__main__":
    main()