from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.db_setup import get_db
