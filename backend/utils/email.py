# utils/email.py
import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

def generate_otp() -> str:
    """Generate a 6 digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(to_email: str, otp: str) -> bool:
    """Send OTP email to user"""
    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "Your ManhwaApp Verification Code"

        body = f"""
        <html>
        <body>
            <h2>ManhwaApp Verification Code</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #6366f1; font-size: 48px; letter-spacing: 10px;">{otp}</h1>
            <p>This code expires in <strong>5 minutes</strong>.</p>
            <p>If you didn't request this code, ignore this email.</p>
        </body>
        </html>
        """

        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_EMAIL, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False
