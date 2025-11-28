from flask import Flask, request, jsonify, session, redirect
from flask_cors import CORS
import requests
import secrets
import hashlib
import base64
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_ID="4f5d7b61c9707f69ed6b33a309636ac"
app.secret_key = os.getenv('SECRET_KEY', 'fallback-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'

CORS(app, supports_credentials=True)

CLIENT_ID = os.getenv('CLIENT_ID')
REDIRECT_URI = "http://localhost:5000/auth/callback"

def generate_pkce():
    """Generate PKCE code verifier and challenge"""
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8')
    code_verifier = code_verifier.replace('=', '')
    
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode('utf-8')).digest()
    ).decode('utf-8').replace('=', '')
    
    return code_verifier, code_challenge

@app.route('/auth/login', methods=['GET'])
def login():
    """Start OAuth flow"""
    code_verifier, code_challenge = generate_pkce()
    state = secrets.token_urlsafe(16)
    
    # Store in session
    session['code_verifier'] = code_verifier
    session['state'] = state
    
    # Build auth URL
    auth_url = f"https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id={CLIENT_ID}&code_challenge={code_challenge}&state={state}"
    
    return jsonify({'auth_url': auth_url})

@app.route('/auth/callback')
def callback():
    """Handle OAuth callback"""
    code = request.args.get('code')
    state = request.args.get('state')

    if state != session.get('state'):
        return jsonify({'error': 'Invalid state'}), 400
    
    code_verifier = session.get('code_verifier')

    token_data = {
        'client_id': CLIENT_ID,
        'code': code,
        'code_verifier': code_verifier,
        'grant_type': 'authorization_code'
    }

    response = requests.post('https://myanimelist.net/v1/oauth2/token', data=token_data)

    if response.status_code != 200:
        return jsonify({'error': 'Failed to get token', 'details': response.text}), 400

    tokens = response.json()

    session['access_token'] = tokens['access_token']
    session['refresh_token'] = tokens['refresh_token']


    return jsonify({'message': 'Login successful!', 'access_token': tokens['access_token']})


@app.route('/search/anime', methods=['GET'])
def search_anime():
    query = request.args.get('q')

    if not query:
        return jsonify({'error': 'Missing query parameter'}), 400
    
    url = "https://api.myanimelist.net/v2/anime"
    headers = {"X-MAL-CLIENT-ID": CLIENT_ID}
    params = {
        "q": query,
        "limit": 10,
        "fields": "id, title, main_picture, synopsis, mean"
    }

    response = requests.get(url, headers=headers, params=params)
    return jsonify(response.json())

@app.route('/anime/<int:anime_id>', methods=['GET'])
def get_anime(anime_id):
    url = f"https://api.myanimelist.net/v2/anime/{anime_id}"
    headers = {"X-MAL-CLIENT-ID": CLIENT_ID}
    params = {
        "fields": "id,title,main_picture,synopsis,mean,genres,studios,num_episodes"
    }
    
    response = requests.get(url, headers=headers, params=params)
    return jsonify(response.json())


@app.route('/search/manga', methods=['GET'])
def search_manga():
    query = request.args.get('q')
    
    if not query:
        return jsonify({'error': 'Missing query parameter'}), 400
    
    url = "https://api.myanimelist.net/v2/manga"
    headers = {"X-MAL-CLIENT-ID": CLIENT_ID}
    params = {
        "q": query,
        "limit": 10,
        "fields": "id,title,main_picture,synopsis,mean, media_type"
    }
    
    response = requests.get(url, headers=headers, params=params)
    return jsonify(response.json())

@app.route('/manga/<int:manga_id>', methods=['GET'])
def get_manga(manga_id):
    url = f"https://api.myanimelist.net/v2/manga/{manga_id}"
    headers = {"X-MAL-CLIENT-ID": CLIENT_ID}
    params = {
        "fields": "id,title,main_picture,synopsis,mean,genres,authors,num_chapters"
    }
    
    response = requests.get(url, headers=headers, params=params)
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True, port=5000)
