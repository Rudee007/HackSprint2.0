from pydantic import BaseModel

class UserInput(BaseModel):
    age: int
    gender: str
    symptoms: str
    severity: str  # "sometimes", "often", "always"
