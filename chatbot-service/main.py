from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from panchakarma_chatbot import chat_panchakarma
from predict_panchakarma import predict_panchakarma

# ---------------------------------------------------------
# FASTAPI APP INITIALIZATION
# ---------------------------------------------------------

app = FastAPI(
    title="Panchakarma AI Microservice",
    description="Gemini-powered Panchakarma Chatbot & Therapy Predictor",
    version="1.0.0"
)

# ---------------------------------------------------------
# CORS (IMPORTANT for connecting React & Node.js)
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # You can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# CHATBOT ENDPOINT
# ---------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    history: list | None = None


@app.post("/chat", tags=["Chatbot"])
async def chatbot_endpoint(req: ChatRequest):
    """
    Panchakarma Chatbot using Gemini
    """
    response = chat_panchakarma(req.message, req.history)
    return {"reply": response}


# ---------------------------------------------------------
# THERAPY PREDICTION ENDPOINT
# ---------------------------------------------------------

class TherapyRequest(BaseModel):
    age: int
    gender: str
    complaint: str


@app.post("/predict-therapy", tags=["Therapy Prediction"])
async def therapy_predictor(req: TherapyRequest):
    """
    Predict the correct Panchakarma therapy using Gemini
    """
    therapy, doctors = predict_panchakarma(
        req.age,
        req.gender,
        req.complaint
    )

    return {
        "therapy": therapy,
        "vaidya_list": doctors
    }


# ---------------------------------------------------------
# ROOT TEST ENDPOINT
# ---------------------------------------------------------

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Panchakarma AI Microservice is running!"}
