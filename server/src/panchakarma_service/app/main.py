from fastapi import FastAPI
from .models import UserInput
from .recommender import recommend_system
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Panchakarma Recommendation API")





# 👇 origins allowed to call this API
origins = [
    "http://localhost:3003",
    "http://localhost:5173",

                # React dev server
    # "https://your-prod-site.com"   <-- add prod domain later
]



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # or ["*"] during quick tests
    allow_credentials=True,       # needed if you send cookies / auth
    allow_methods=["*"],          # GET, POST, PUT, … (all)
    allow_headers=["*"],          # Authorization, Content-Type, …
)



@app.post("/recommend")
async def get_recommendation(user_input: UserInput):
    result = await recommend_system(
        user_symptoms=user_input.symptoms,
        severity=user_input.severity,
        top_n=5
    )
    print(result)
    return result

