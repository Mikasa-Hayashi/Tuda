from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router

app = FastAPI(
    title="Tuda",
    version="1.0.0",
)

app.include_router(api_router, prefix="/api")

# Monument photos live outside the app bundle: the client resolves the relative
# image_url ("/static/monuments/<id>.jpg") against the server origin.
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
