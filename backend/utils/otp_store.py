# utils/otp_store.py
import time
from typing import Optional, Dict

# In-memory OTP storage
# Format: {email: {"otp": "123456", "expires_at": timestamp}}
otp_storage: Dict[str, dict] = {}

OTP_EXPIRY_SECONDS = 300  # 5 minutes

def store_otp(email: str, otp: str):
    """Store OTP with expiry timestamp"""
    otp_storage[email] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS
    }

def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP and remove it after use"""
    if email not in otp_storage:
        return False
    
    stored = otp_storage[email]
    
    # Check if expired
    if time.time() > stored["expires_at"]:
        del otp_storage[email]
        return False
    
    # Check if OTP matches
    if stored["otp"] != otp:
        return False
    
    # Delete after successful verification
    del otp_storage[email]
    return True

def get_otp_remaining_time(email: str) -> Optional[int]:
    """Get remaining seconds for OTP"""
    if email not in otp_storage:
        return None
    remaining = otp_storage[email]["expires_at"] - time.time()
    return max(0, int(remaining))
