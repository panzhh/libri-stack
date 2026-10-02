"""Production entry point: `gunicorn --chdir backend --preload wsgi:app` (see Procfile).

--preload imports this once in the gunicorn master process, so the catalog import
and the reminder scheduler run once, not once per worker.
"""
from app import app, start_background_services

start_background_services()
