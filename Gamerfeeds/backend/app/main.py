from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.api.routers import router
from app.api.db_setup import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(router=router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://gamerfeeds.se",
        "http://gamerfeeds.se",
        "https://ajmueller0625.github.io/Webbapp-Projekt/",
        "localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
