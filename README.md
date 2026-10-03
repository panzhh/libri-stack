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
| `FRONTEND_URL` | Heroku | Base URL for links in emails (default `http://localhost:5173`). |
| `VITE_API_URL` | local `.env` | Backend URL for the dev server. Leave unset on Heroku: the site calls the API on the same domain. |
| `RUN_SCHEDULER` | optional | Set to `0` to turn off the daily reminder job. |

The daily reminder only runs while the dyno is awake. On an Eco dyno, which
sleeps when idle, set `RUN_SCHEDULER=0` and add the Heroku Scheduler add-on
with a daily job running `python backend/send_reminders.py`.

## Useful scripts

- `backend/reset_db.py` — **deletes all data** and recreates empty tables.
- `backend/cleanData.py` — regenerates `src/data/books.json` from
  `src/data/book_list_cleaned.csv`.
