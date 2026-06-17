# utils/email.py
import os
from sendgrid import SendGridAPIClient
from sendgrid.mail import Mail
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("GMAIL_EMAIL")

def generate_otp() -> str:
    import random
    import string
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(to_email: str, otp: str) -> bool:
    try:
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject="Your ManhwaApp Verification Code",
            html_content=f"""
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
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False
