from fastapi import APIRouter

from app.api.core.endpoints.news import router as news_router
from app.api.core.endpoints.games import router as game_router


router = APIRouter()

router.include_router(news_router)
router.include_router(game_router)
