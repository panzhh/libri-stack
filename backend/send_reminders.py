"""Send overdue-book reminders once and exit.

For the Heroku Scheduler add-on (command: `python backend/send_reminders.py`),
used instead of the in-process job when RUN_SCHEDULER=0.
"""
from app import check_overdue_tasks

if __name__ == "__main__":
    check_overdue_tasks()
