from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.api.routers import router
from app.api.db_setup import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(router=router)
