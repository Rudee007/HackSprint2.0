import pickle
import pandas as pd

# Load doctor data
with open("doctor_data.pkl", "rb") as f:
    df_doctor = pickle.load(f)

# Load vectorizer
with open("vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

__all__ = ["df_doctor", "vectorizer"]
