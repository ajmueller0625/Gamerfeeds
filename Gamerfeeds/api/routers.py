from fastapi import APIRouter

from api.core.endpoints.news import router as news_router


router = APIRouter()

router.include_router(news_router)
