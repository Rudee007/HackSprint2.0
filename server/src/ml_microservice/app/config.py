import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.environ.get("MODEL_PATH", f"{ROOT}/models/doctor_model.pkl")
TOP_K_DEFAULT = int(os.environ.get("TOP_K_DEFAULT", 3))
