from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Essay NLP Scoring Service")

# Load model once at startup — not on every request
logger.info("Loading sentence transformer model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("Model loaded ✅")


class ScoreRequest(BaseModel):
    answer_key: str
    student_answer: str

    @validator("answer_key", "student_answer")
    def must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("must not be empty")
        return v.strip()


class ScoreResponse(BaseModel):
    score: float          # 0.0 – 1.0
    score_percent: float  # 0.0 – 100.0
    label: str            # Excellent / Good / Fair / Poor


def get_label(score: float) -> str:
    if score >= 0.85:
        return "Excellent"
    elif score >= 0.70:
        return "Good"
    elif score >= 0.50:
        return "Fair"
    else:
        return "Poor"


@app.get("/health")
def health():
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    try:
        # Encode both texts into embeddings
        embeddings = model.encode([req.answer_key, req.student_answer])

        # Cosine similarity returns value between -1 and 1
        # For sentence embeddings it's typically 0 to 1
        sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

        # Clamp to 0-1 range
        score = float(np.clip(sim, 0.0, 1.0))

        logger.info(f"Scored: {score:.4f} | label: {get_label(score)}")

        return ScoreResponse(
            score=round(score, 4),
            score_percent=round(score * 100, 2),
            label=get_label(score),
        )

    except Exception as e:
        logger.error(f"Scoring failed: {e}")
        raise HTTPException(status_code=500, detail="scoring failed")