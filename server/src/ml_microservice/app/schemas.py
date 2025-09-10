from pydantic import BaseModel
from typing import List, Optional

class RecommendRequest(BaseModel):
    symptoms: str
    top_n: Optional[int] = 3

class TherapyInfo(BaseModel):
    name: str
    description: Optional[str] = None

class DoctorInfo(BaseModel):
    doctor_name: str
    specialization: Optional[str] = None
    hospital: Optional[str] = None
    experience: Optional[str] = None

class Recommendation(BaseModel):
    therapy: TherapyInfo
    doctor: DoctorInfo

class RecommendResponse(BaseModel):
    recommendations: List[Recommendation]
