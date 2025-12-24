# routes/media.py

from fastapi import APIRouter, HTTPException, Query, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import extract, or_
from typing import Optional, List

from database import get_db
from models import Media
from controllers.media import media_to_dict, search_media, get_trending_media, get_media_by_id

router = APIRouter(prefix="/media", tags=["media"])


# -------------------- SEARCH --------------------
@router.get("/search")
def search(
    query: str = Query(..., min_length=1),
    type: Optional[str] = None,
    genre: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        results = search_media(db, query, type, genre)
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")


# -------------------- TRENDING --------------------
@router.get("/trending")
def trending(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=100)):
    try:
        results = get_trending_media(db, limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")


# -------------------- FILTERING --------------------
@router.get("/filtering")
def filtering(
    types: Optional[str] = Query(None),
    genres: Optional[str] = Query(None),
    statuses: Optional[str] = Query(None),
    years: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Media)

        # Filter by types
        if types:
            type_list = [t.strip().upper() for t in types.split(',')]
            query = query.filter(Media.type.in_(type_list))

        # Filter by genres (at least one match)
        if genres:
            genre_list = [g.strip() for g in genres.split(',')]
            query = query.filter(Media.genres.overlap(genre_list))

        # Filter by statuses
        if statuses:
            status_list = [s.strip().upper() for s in statuses.split(',')]
            query = query.filter(Media.status.in_(status_list))

        # Filter by years
        if years:
            year_list = [y.strip() for y in years.split(',')]
            year_conditions = []
            for year in year_list:
                try:
                    year_int = int(year)
                    year_conditions.append(extract('year', Media.start_date) == year_int)
                except ValueError:
                    continue
            if year_conditions:
                query = query.filter(or_(*year_conditions))

        # Order and limit
        query = query.order_by(Media.popularity.desc(), Media.average_score.desc())
        results = query.limit(limit).all()

        return [media_to_dict(m) for m in results]

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# -------------------- GET MEDIA BY ID --------------------
@router.get("/{media_id}")
def get_media(media_id: int, db: Session = Depends(get_db)):
    try:
        media_obj = get_media_by_id(db, media_id)
        return media_obj
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")


# -------------------- DEBUG --------------------
@router.get("/debug")
def debug_media(db: Session = Depends(get_db)):
    total = db.query(Media).count()
    with_dates = db.query(Media).filter(Media.start_date.isnot(None)).count()
    sample = db.query(Media).filter(Media.start_date.isnot(None)).limit(3).all()

    return {
        "total_media": total,
        "media_with_dates": with_dates,
        "sample_dates": [
            {
                "title": m.title_romaji,
                "start_date": str(m.start_date),
                "type": m.type
            } for m in sample
        ]
    }
