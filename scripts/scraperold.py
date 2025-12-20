import requests
from bs4 import BeautifulSoup

url = "https://www.webtoons.com/en/"

response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

title_tag = soup.find('title_no')
if title_tag:
	page_title = title_tag.text
	print(f"Page Title: {page_title} \n")

links = soup.find_all('a')
for link in links:
	print("links: \n")
	print(link.get('href'))
	title_attribute = link.get('title_no', 'N/A')
	print(f"\n{title_attribute}")

genre_tag = soup.find('genre')
if genre_tag:
	page_genre = genre_tag.text
	print(f"Genre title: {page_genre}")


