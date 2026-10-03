"""Send the app's emails, through the Gmail API when it is configured.

Gmail refuses SMTP password logins from Heroku's servers, but its HTTPS API
works from anywhere. When GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and
GMAIL_REFRESH_TOKEN are set (see gmail_authorize.py), messages go through the
API as the authorised account; otherwise they use Flask-Mail's SMTP settings
(fine for local development).
"""
import base64
import os
import threading
import time

import requests

TOKEN_URL = "https://oauth2.googleapis.com/token"
SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"


class EmailSender:
    def __init__(self, mail):
        self.mail = mail  # Flask-Mail, used when the Gmail API is not configured
        self.client_id = os.getenv("GMAIL_CLIENT_ID")
        self.client_secret = os.getenv("GMAIL_CLIENT_SECRET")
        self.refresh_token = os.getenv("GMAIL_REFRESH_TOKEN")
        self._access_token = None
        self._expires_at = 0
        self._lock = threading.Lock()

    @property
    def uses_gmail_api(self):
        return bool(self.client_id and self.client_secret and self.refresh_token)

    def send(self, msg):
        """Send a flask_mail.Message; raises on failure like Mail.send does."""
        if not self.uses_gmail_api:
            return self.mail.send(msg)

        mime = msg._message()  # the full MIME message Flask-Mail would send
        if msg.bcc:  # Flask-Mail leaves Bcc out of the headers; Gmail needs it
            mime["Bcc"] = ", ".join(msg.bcc)
        raw = base64.urlsafe_b64encode(mime.as_bytes()).decode()
        response = requests.post(
            SEND_URL,
            headers={"Authorization": f"Bearer {self._token()}"},
            json={"raw": raw},
            timeout=30,
        )
        if response.status_code >= 400:
            raise RuntimeError(
                f"Gmail API send failed ({response.status_code}): {response.text[:300]}"
            )

    def _token(self):
        """A short-lived access token, refreshed shortly before it expires."""
        with self._lock:
            if self._access_token and time.time() < self._expires_at - 60:
                return self._access_token
            response = requests.post(
                TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token",
                },
                timeout=30,
            )
            if response.status_code >= 400:
                raise RuntimeError(
                    f"Gmail API authorisation failed ({response.status_code}): "
                    f"{response.text[:300]}"
                )
            data = response.json()
            self._access_token = data["access_token"]
            self._expires_at = time.time() + int(data.get("expires_in", 3600))
            return self._access_token
