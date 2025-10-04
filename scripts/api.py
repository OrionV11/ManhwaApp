from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

DB_PATH = 'manhwa.db'


def get_db_connection():
    """Create database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn


@app.route('/api/webtoons', methods=['GET'])
def get_webtoons():
    """Get all webtoons with optional filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        genre = request.args.get('genre', None)
        search = request.args.get('search', None)
        
        conn = get_db_connection()
        
        # Build query
        query = 'SELECT * FROM manhwa WHERE 1=1'
        params = []
        
        if genre:
            query += ' AND genre LIKE ?'
            params.append(f'%{genre}%')
        
        if search:
            query += ' AND (title LIKE ? OR description LIKE ?)'
            params.append(f'%{search}%')
            params.append(f'%{search}%')
        
        # Get total count
        count_query = query.replace('SELECT *', 'SELECT COUNT(*)')
        total = conn.execute(count_query, params).fetchone()[0]
        
        # Add pagination
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([per_page, (page - 1) * per_page])
        
        # Execute query
        webtoons = conn.execute(query, params).fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        result = [dict(row) for row in webtoons]
        
        return jsonify({
            'success': True,
            'data': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': (total + per_page - 1) // per_page
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/webtoons/<int:webtoon_id>', methods=['GET'])
def get_webtoon(webtoon_id):
    """Get single webtoon by ID"""
    try:
        conn = get_db_connection()
        webtoon = conn.execute('SELECT * FROM manhwa WHERE id = ?', (webtoon_id,)).fetchone()
        conn.close()
        
        if webtoon:
            return jsonify({
                'success': True,
                'data': dict(webtoon)
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Webtoon not found'
            }), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/genres', methods=['GET'])
def get_genres():
    """Get all unique genres"""
    try:
        conn = get_db_connection()
        genres = conn.execute('SELECT DISTINCT genre FROM manhwa WHERE genre IS NOT NULL AND genre != ""').fetchall()
        conn.close()
        
        genre_list = [row['genre'] for row in genres]
        
        return jsonify({
            'success': True,
            'data': sorted(genre_list)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    try:
        conn = get_db_connection()
        
        total_webtoons = conn.execute('SELECT COUNT(*) as count FROM manhwa').fetchone()['count']
        total_episodes = conn.execute('SELECT SUM(num_episodes) as total FROM manhwa').fetchone()['total']
        genre_counts = conn.execute('''
            SELECT genre, COUNT(*) as count 
            FROM manhwa 
            WHERE genre IS NOT NULL AND genre != ""
            GROUP BY genre 
            ORDER BY count DESC
        ''').fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_webtoons': total_webtoons,
                'total_episodes': total_episodes or 0,
                'genre_distribution': [dict(row) for row in genre_counts]
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print(f"Warning: Database file '{DB_PATH}' not found!")
    app.run(debug=True, port=5000)