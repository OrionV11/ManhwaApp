import requests
import json
import sqlite3
import time
import os
from bs4 import BeautifulSoup


def init_db():
    conn = sqlite3.connect('manhwa.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS manhwa
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT,
                  cover_url TEXT,
                  description TEXT,
                  genre TEXT,
                  num_episodes INTEGER,
                  detail_url TEXT UNIQUE)''')
    conn.commit()
    return conn # Return connection for further use

def save_to_db(conn, data):
    c = conn.cursor()
    try:
        c.execute('''INSERT INTO manhwa (title, cover_url, description, genre, num_episodes, detail_url)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (data['title'], data['cover_url'], data['description'], data['genre'], data['num_episodes'], data['detail_url']))
        conn.commit()
    except Exception as e:
        print(f"Error saving to DB: {e}")
def get_all_pages(base_genre_url):
    page = 1
    all_links = []
    while True:
        url = f"{base_genre_url}&page={page}"
        links = get_webtoon_links(url)
        if not links:
            break
        all_links.extend(links)
        page += 1
        time.sleep(1)  # Be polite and avoid overwhelming the server
    return list(set(all_links))

BASE_URL = "https://www.webtoons.com/en/"
'''
def write_f(filename, content, mode = 'w'):
    with open(filename, 'w') as file:
        file.write(content)

def save_file(filename, content, mode = 'w'):
  with open(filename, mode) as file:
    file.write(content)

def read_f(filename, mode = 'r'):
  with open(filename, mode) as file:
    return file.read()

def print_file(filename):
  print(read_f(filename, mode = 'r'))
'''
def get_webtoon_links(listing_url):
    response = requests.get(listing_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    # Find all webtoon links on the listing page
    links = []
    for a in soup.select('a[href*="/en/"]'):
        href = a.get('href')
        if href and '/en/' in href and '/list' in href:
            links.append(href)
    return list(set(links))

def scrape_webtoon_detail(detail_url):
    response = requests.get(detail_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    # Title
    title = soup.find('h1', class_='detail_title').text.strip() if soup.find('h1', class_='detail_title') else ''
    # Cover Art
    cover_img = soup.find('img', class_='detail_img')
    cover_url = cover_img['src'] if cover_img else ''
    # Description/Summary
    desc = soup.find('p', class_='summary').text.strip() if soup.find('p', class_='summary') else ''
    # Genre
    genre = soup.find('span', class_='genre').text.strip() if soup.find('span', class_='genre') else ''
    # Number of Episodes
    episodes = soup.select('ul#_listUl li')
    num_episodes = len(episodes)
    return {
        'title': title,
        'cover_url': cover_url,
        'description': desc,
        'genre': genre,
        'num_episodes': num_episodes,
        'detail_url': detail_url
    }

def main():
    # Example: scrape from the 'Action' genre page
    conn = init_db()
    genre_url = BASE_URL + "fantasy"
    webtoon_links = get_webtoon_links(genre_url)
    for link in webtoon_links:
        data = scrape_webtoon_detail(link)
        save_to_db(conn, data)
        time.sleep(1)  # Be polite
    conn.close()


if __name__ == "__main__":
    main()