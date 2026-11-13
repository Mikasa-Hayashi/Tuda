from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    # GigaChat (AI routes). Without the key /api/ai-route answers 503 and the
    # app falls back to a locally generated route.
    GIGACHAT_AUTH_KEY: str | None = None
    GIGACHAT_SCOPE: str = "GIGACHAT_API_PERS"
    GIGACHAT_MODEL: str = "GigaChat"
    # Sber endpoints use the Russian Ministry of Digital Development root CA,
    # which is not in the default trust store. Set a CA bundle path to verify,
    # or leave False for local/demo use.
    GIGACHAT_VERIFY_SSL: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
