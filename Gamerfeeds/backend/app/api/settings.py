from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_URL: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int
    POSTMARK_TOKEN: str
    FRONTEND_BASE_URL: str

    model_config = SettingsConfigDict(env_file='app/.env', extra='ignore')


settings = Settings()
