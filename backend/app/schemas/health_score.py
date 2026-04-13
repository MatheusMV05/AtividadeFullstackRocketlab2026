from pydantic import BaseModel


class HealthScoreResponse(BaseModel):
    score: float
    rating_component: float
    sales_30d_component: float
    quality_component: float
