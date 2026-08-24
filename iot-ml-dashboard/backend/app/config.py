from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "IoT ML Dashboard API"
    environment: str = "development"
    database_url: str = "sqlite:///./data/app.db"
