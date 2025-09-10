from fastapi import FastAPI
from .schemas import RecommendRequest, RecommendResponse
from .model import model_service

app = FastAPI(title="Therapy & Doctor Recommendation Service")

@app.post("/recommend", response_model=RecommendResponse)
def recommend_endpoint(request: RecommendRequest):
    results = model_service.recommend(
        symptoms=request.symptoms,
        top_n=request.top_n or 3
    )
    return {"recommendations": results}
