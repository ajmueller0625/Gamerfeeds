from fastapi import APIRouter

from app.api.core.endpoints.news import router as news_router
from app.api.core.endpoints.games import router as game_router
from app.api.core.endpoints.events import router as event_router
from app.api.core.endpoints.search import router as search_router
from app.api.core.endpoints.authentication import router as auth_router
from app.api.core.endpoints.generals import router as general_router
from app.api.core.endpoints.comments import router as comment_router
from app.api.core.endpoints.discussions import router as discussion_router


router = APIRouter()

router.include_router(general_router)
router.include_router(news_router)
router.include_router(game_router)
router.include_router(event_router)
router.include_router(search_router)
router.include_router(auth_router)
router.include_router(comment_router)
router.include_router(discussion_router)
