# wsgi.py — Production entry point for Railway / Render / Gunicorn
from app import app

if __name__ == "__main__":
    app.run()
