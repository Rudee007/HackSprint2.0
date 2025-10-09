from .load_data import df_doctor, vectorizer
from sklearn.metrics.pairwise import cosine_similarity
from motor.motor_asyncio import AsyncIOMotorClient
import os

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client["SIHProj"]  # replace with your actual DB name
users_collection = db["users"]

async def recommend_system(user_symptoms, severity, top_n=3):
    """
    Returns self-monitor advice or doctor + therapy recommendations
    enriched with MongoDB details (_id, email, location).
    """
    if severity.lower() == "sometimes":
        return {
            "action": "self-monitor",
            "suggestion": "Monitor your symptoms carefully. Consult a doctor if they worsen."
        }

    # Split symptoms
    symptoms_list = [s.strip() for s in user_symptoms.replace("and", ",").split(",") if s.strip()]
    
    therapy_recommendations = []
    recommended_therapies = set()

    for symptom in symptoms_list:
        user_vec = vectorizer.transform([symptom])
        cosine_sim = cosine_similarity(user_vec, vectorizer.transform(df_doctor["symptoms"].astype(str))).flatten()
        
        top_idx = cosine_sim.argmax()
        therapy = df_doctor.iloc[top_idx]["panchakarma"]

        if therapy not in recommended_therapies:
            recommended_therapies.add(therapy)
            therapy_doctors = df_doctor[df_doctor["panchakarma"] == therapy].head(top_n)

            doctors = []
            for _, row in therapy_doctors.iterrows():
                doctor_name = row["vaidya_name"]
                
                # Fetch doctor from MongoDB by name
                doctor_doc = await users_collection.find_one({"name": doctor_name, "role": "doctor"})
                
                if doctor_doc:
                    doctors.append({
                        "doctorId": str(doctor_doc["_id"]),
                        "name": doctor_doc["name"],
                        "email": doctor_doc.get("email"),
                        "phone": doctor_doc.get("phone"),
                        "address": doctor_doc.get("address", {}),
                        "profile": doctor_doc.get("profile", {})
                    })

            therapy_recommendations.append({
                "therapy": therapy,
                "doctors": doctors
            })

    return {
        "action": "visit doctor",
        "recommendations": therapy_recommendations
    }
