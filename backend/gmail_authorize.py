"""One-time setup: let the website send email through the Gmail API.

Run on your own computer (not on Heroku), from the backend folder:

    venv/bin/python gmail_authorize.py path/to/client_secret.json

`client_secret.json` is the OAuth client ("Desktop app") downloaded from the
Google Cloud Console. A browser opens; sign in as the library's Gmail account
(the one in Heroku's MAIL_USERNAME, churchlibdl@gmail.com) and click Allow. The script then prints the
`heroku config:set` command with the three GMAIL_* settings.

Only the "send email" permission is requested: the site cannot read the inbox.
"""
import json
import secrets
import sys
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests

SCOPE = "https://www.googleapis.com/auth/gmail.send"
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"


def load_client(path):
    with open(path) as f:
        data = json.load(f)
    client = data.get("installed") or data.get("web")
    if not client:
        sys.exit("This file is not an OAuth client secret. Create a 'Desktop app' client.")
    return client["client_id"], client["client_secret"]


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    client_id, client_secret = load_client(sys.argv[1])
    state = secrets.token_urlsafe(16)
    result = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if query.get("state", [None])[0] != state:
                self.send_response(400)
                self.end_headers()
                return
            result.update({k: v[0] for k, v in query.items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            message = (
                "Done. You can close this tab and go back to the terminal."
                if "code" in result
                else f"Google returned an error: {result.get('error')}"
            )
            self.wfile.write(f"<p style='font:18px sans-serif'>{message}</p>".encode())

        def log_message(self, *args):
            pass

    server = HTTPServer(("127.0.0.1", 0), Handler)  # any free port
    redirect_uri = f"http://127.0.0.1:{server.server_port}"
    url = AUTH_URL + "?" + urllib.parse.urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": SCOPE,
            "access_type": "offline",  # we need a refresh token
            "prompt": "consent",  # always return one, even if allowed before
            "state": state,
        }
    )
    print("Opening Google in your browser. If it does not open, visit:\n\n" + url + "\n")
    webbrowser.open(url)
    while "code" not in result and "error" not in result:
        server.handle_request()
    if "error" in result:
        sys.exit(f"Authorisation was not completed: {result['error']}")

    tokens = requests.post(
        TOKEN_URL,
        data={
            "code": result["code"],
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=30,
    ).json()
    if "refresh_token" not in tokens:
        sys.exit(f"Google did not return a refresh token: {tokens}")

    print("Success. Run this to configure the live site (keep these values private):\n")
    print(
        "heroku config:set -a libri-stack-be \\\n"
        f"  GMAIL_CLIENT_ID='{client_id}' \\\n"
        f"  GMAIL_CLIENT_SECRET='{client_secret}' \\\n"
        f"  GMAIL_REFRESH_TOKEN='{tokens['refresh_token']}'"
    )


if __name__ == "__main__":
    main()
