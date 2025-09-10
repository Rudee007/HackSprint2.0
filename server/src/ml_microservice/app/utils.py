# ml_microservice/app/utils.py
import logging
import re

logger = logging.getLogger("ml_microservice")
if not logger.handlers:
    handler = logging.StreamHandler()
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handler.setFormatter(fmt)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

def sanitize_text(text: str) -> str:
    # Basic sanitize: trim, collapse whitespace, remove weird control chars
    if not isinstance(text, str):
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    # optionally drop weird control chars
    text = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", text)
    return text
