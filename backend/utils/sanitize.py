import bleach
from typing import Optional

def sanitize_text(text: Optional[str]) -> Optional[str]:
    """Strip all HTML tags and dangerous content"""
    if text is None:
        return None
    return bleach.clean(text, tags=[], strip=True).strip()

def sanitize_html(text: Optional[str]) -> Optional[str]:
    """Allow only safe HTML tags"""
    if text is None:
        return None
    allowed_tags = ['b', 'i', 'em', 'strong', 'p', 'br']
    return bleach.clean(text, tags=allowed_tags, strip=True).strip()

def sanitize_username(username: str) -> str:
    """Strip HTML and limit to alphanumeric and underscores"""
    cleaned = bleach.clean(username, tags=[], strip=True).strip()
    return ''.join(c for c in cleaned if c.isalnum() or c == '_')
