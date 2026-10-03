# Church in Dunn Loring Library

A library website for the Church in Dunn Loring: members browse the catalog,
borrow and return books, and request new ones; admins manage the collection,
loans, users and requests.

- **Frontend:** React 19 + Vite + Tailwind CSS (`src/`)
- **Backend:** Flask + SQLAlchemy + PostgreSQL (`backend/`)
- **Hosting:** Heroku — one dyno runs gunicorn, which serves both the API (`/api/...`)
  and the built React site

## Local development

Requirements: Node 24, Python 3.10, PostgreSQL.

1. Create a `.env` file in the project root:

   ```
   SQLALCHEMY_DATABASE_URI=postgresql://<user>:<password>@localhost:5432/libri_db
   JWT_SECRET_KEY=<long random string>
   MAIL_USERNAME=<gmail address>
   MAIL_PASSWORD=<gmail app password>
   VITE_API_URL=http://localhost:5000
   ```

2. Start the backend (port 5000). On first run it creates the tables and imports
   the catalog from `src/data/books.json`:

   ```bash
   cd backend
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   python app.py
   ```

3. In a second terminal, start the frontend (port 5173):

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:5173. The first admin registers on the **Admin** tab
   with the code `ROOT1`; later admins need an existing admin's invite code.

## Deploying to Heroku

The Heroku app is `libri-stack-be` (git remote `heroku`). It hosts both the
website and the API. Pushing `main` to it builds and releases the site:

```bash
git push heroku main
```

During the build Heroku:

1. installs Node packages and runs `npm run build`, producing `dist/`
   (Node buildpack);
2. installs the Python packages from `requirements.txt` (Python buildpack);
3. starts the `web` process from the `Procfile`:
   `gunicorn --chdir backend --preload wsgi:app`.

`backend/wsgi.py` creates any missing tables, imports the catalog if the
database is empty, and starts the daily reminder job (9:00 AM Eastern).

### One-time setup

```bash
heroku login
heroku git:remote -a libri-stack-be   # point the `heroku` git remote at the app
heroku info -a libri-stack-be         # "Web URL" is the site address

heroku buildpacks:clear -a libri-stack-be
heroku buildpacks:add heroku/nodejs -a libri-stack-be
heroku buildpacks:add heroku/python -a libri-stack-be

heroku config:set -a libri-stack-be \
  JWT_SECRET_KEY=<long random string> \
  MAIL_USERNAME=<gmail address> \
  MAIL_PASSWORD=<gmail app password> \
  FRONTEND_URL=<Web URL from heroku info, without the trailing slash>
```

`DATABASE_URL` is set automatically by the Heroku Postgres add-on.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `SQLALCHEMY_DATABASE_URI` | local `.env` | Local database. Takes priority over `DATABASE_URL`. |
| `DATABASE_URL` | Heroku (automatic) | Heroku Postgres. |
| `JWT_SECRET_KEY` | both | Signs login tokens and email-verification links. |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | both | Gmail account used to send emails. |
| `MAIL_SERVER`, `MAIL_PORT` | optional | SMTP server (default `smtp.gmail.com` / `587`). Gmail blocks logins from Heroku, so production can use an email service such as Brevo (`smtp-relay.brevo.com` / `587`). |
| `MAIL_DEFAULT_SENDER` | optional | The From address (default `MAIL_USERNAME`). Set it to `churchlibdl@gmail.com` when `MAIL_USERNAME` is an email service login. |
| `CONTACT_EMAIL` | optional | Where Contact Us messages are emailed (default `churchlibdl@gmail.com`). |
| `FRONTEND_URL` | Heroku | Base URL for links in emails (default `http://localhost:5173`). |
| `VITE_API_URL` | local `.env` | Backend URL for the dev server. Leave unset on Heroku: the site calls the API on the same domain. |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Heroku | Send through the Gmail API (see below). |
| `RUN_SCHEDULER` | optional | Set to `0` to turn off the daily reminder job. |

The daily reminder only runs while the dyno is awake. On an Eco dyno, which
sleeps when idle, set `RUN_SCHEDULER=0` and add the Heroku Scheduler add-on
with a daily job running `python backend/send_reminders.py`.

## Sending email from Heroku (Gmail API)

Gmail refuses SMTP password logins from Heroku's servers, so the live site
sends through the **Gmail API** as the account in Heroku's `MAIL_USERNAME`
(**churchlibdl@gmail.com**). Locally, the normal
SMTP settings in `.env` keep working. One-time setup, about 15 minutes:

1. Open https://console.cloud.google.com and sign in as **churchlibdl@gmail.com**
   (the sending account; any Google account can own the project).
   Create a project, e.g. "Library Website".
2. **APIs & Services > Library**: search for **Gmail API** and click **Enable**.
3. **Google Auth Platform** (OAuth consent screen): click **Get started**.
   App name "Church in Dunn Loring Library", support and contact email
   churchlibdl@gmail.com, audience **External**. Then under **Audience** click
   **Publish app** so it is "In production". (In "Testing" mode Google expires
   the permission after 7 days and emails stop.)
4. **Clients > Create client**: application type **Desktop app**, any name.
   Click **Download JSON**.
5. On your computer:
   ```bash
   cd backend
   venv/bin/python gmail_authorize.py ~/Downloads/client_secret_XXXX.json
   ```
   A browser opens. Choose **churchlibdl@gmail.com** (the sending account).
   Google warns "Google hasn't
   verified this app": click **Advanced > Go to Church in Dunn Loring Library**,
   then **Continue**. Only the "send email" permission is requested.
6. Run the `heroku config:set ... GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=...
   GMAIL_REFRESH_TOKEN=...` command the script prints. Then delete the
   downloaded JSON file (or keep it somewhere private).

When the three `GMAIL_*` settings are present, all emails go through the
Gmail API; remove them to go back to SMTP. If emails stop later with
"Gmail API authorisation failed", the permission was revoked (for example
from the Google account's security page); repeat steps 5 and 6.

## Useful scripts

- `backend/reset_db.py` — **deletes all data** and recreates empty tables.
- `backend/cleanData.py` — regenerates `src/data/books.json` from
  `src/data/book_list_cleaned.csv`.
