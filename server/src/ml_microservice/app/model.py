import pickle
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
from .config import MODEL_PATH, TOP_K_DEFAULT

class ModelService:
    def __init__(self):
        with open(MODEL_PATH, "rb") as f:
            model_data = pickle.load(f)

        self.vectorizer = model_data["vectorizer"]
        self.tfidf_matrix = model_data["tfidf_matrix"]
        self.df: pd.DataFrame = model_data["data"]

    def recommend(self, symptoms: str, top_n: int = TOP_K_DEFAULT):
        # Vectorize input
        user_vec = self.vectorizer.transform([symptoms])

        # Compute similarity
        similarity_scores = cosine_similarity(user_vec, self.tfidf_matrix).flatten()
        top_indices = similarity_scores.argsort()[-top_n:][::-1]

        results = []
        for idx in top_indices:
            row = self.df.iloc[idx]
            results.append({
                "therapy": {
                    "name": row.get("panchakarma", "N/A"),
                    "description": row.get("therapy_description", "N/A")
                },
                "doctor": {
                    "doctor_name": row.get("doctors", "N/A"),
                    "specialization": row.get("specialization", "N/A"),
                    "hospital": row.get("hospital", "N/A"),
                    "experience": row.get("experience", "N/A")
                }
            })
        return results

model_service = ModelService()
