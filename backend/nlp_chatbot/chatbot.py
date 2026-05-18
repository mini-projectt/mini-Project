import json
import os
import re
import sys
import time
from dataclasses import dataclass
from typing import Dict, List

import joblib
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_PATH = os.path.join(BASE_DIR, "intents.json")
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")

STOP_WORDS = set(ENGLISH_STOP_WORDS)


@dataclass
class IntentMeta:
    response: str
    suggestions: List[str]
    recommendations: List[str]


def preprocess_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = [token for token in text.split() if token and token not in STOP_WORDS]
    return " ".join(tokens)


def load_intents(path: str = INTENTS_PATH) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_training_data(intents_payload: Dict):
    texts = []
    labels = []
    meta = {}

    for intent in intents_payload.get("intents", []):
        tag = intent["tag"]
        meta[tag] = IntentMeta(
            response=intent.get("response", ""),
            suggestions=intent.get("suggestions", []),
            recommendations=intent.get("recommendations", []),
        )

        for pattern in intent.get("patterns", []):
            normalized = preprocess_text(pattern)
            if normalized:
                texts.append(normalized)
                labels.append(tag)

    return texts, labels, meta


def train_and_save_model(model_path: str = MODEL_PATH):
    intents_payload = load_intents()
    texts, labels, meta = build_training_data(intents_payload)

    pipeline = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    min_df=1,
                    max_df=0.95,
                    sublinear_tf=True,
                ),
            ),
            ("clf", MultinomialNB(alpha=0.2)),
        ]
    )

    pipeline.fit(texts, labels)

    artifact = {
        "pipeline": pipeline,
        "meta": {
            tag: {
                "response": data.response,
                "suggestions": data.suggestions,
                "recommendations": data.recommendations,
            }
            for tag, data in meta.items()
        },
    }

    joblib.dump(artifact, model_path)
    return artifact


def load_or_train_model(model_path: str = MODEL_PATH):
    if os.path.exists(model_path):
        try:
            model_mtime = os.path.getmtime(model_path)
            intents_mtime = os.path.getmtime(INTENTS_PATH)
        except OSError:
            model_mtime = 0
            intents_mtime = 0

        if model_mtime >= intents_mtime:
            return joblib.load(model_path)
    return train_and_save_model(model_path)


def predict(query: str, artifact=None):
    started = time.perf_counter()
    artifact = artifact or load_or_train_model()

    pipeline = artifact["pipeline"]
    meta = artifact["meta"]

    processed = preprocess_text(query)
    if not processed:
        return {
            "intent": "UNKNOWN",
            "confidence": 0.0,
            "response": "Please enter a clearer query. I can help with item search, rental, and recommendations.",
            "suggestions": [
                "Show DSLR cameras",
                "Suggest tools for construction",
                "I need a suit for 2 days",
            ],
            "recommendations": ["DSLR Camera", "Electric Drill", "Business Suit"],
            "latency_ms": round((time.perf_counter() - started) * 1000, 2),
            "pipeline": {
                "processed_text": processed,
                "stages": ["preprocess", "tfidf", "multinomial_nb"],
            },
        }

    probs = pipeline.predict_proba([processed])[0]
    classes = pipeline.classes_
    best_idx = probs.argmax()

    intent = classes[best_idx]
    confidence = float(probs[best_idx])

    if confidence < 0.4:
        intent = "FALLBACK"
        response = "I could not confidently classify that request. Try asking for item search, prices, availability, or recommendations."
        suggestions = [
            "Show available cameras",
            "Suggest wedding rental items",
            "How to place an order",
        ]
        recommendations = ["DSLR Camera", "Wedding Sherwani", "Generator"]
    else:
        intent_meta = meta.get(intent, {})
        response = intent_meta.get("response", "I can help with rentals and recommendations.")
        suggestions = intent_meta.get("suggestions", [])
        recommendations = intent_meta.get("recommendations", [])

    return {
        "intent": intent,
        "confidence": round(confidence, 4),
        "response": response,
        "suggestions": suggestions,
        "recommendations": recommendations,
        "latency_ms": round((time.perf_counter() - started) * 1000, 2),
        "pipeline": {
            "processed_text": processed,
            "stages": ["preprocess", "tfidf", "multinomial_nb"],
        },
    }


def cli():
    if len(sys.argv) < 2:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "Usage: python chatbot.py '<query text>'",
                }
            )
        )
        sys.exit(1)

    query = " ".join(sys.argv[1:])

    try:
        artifact = load_or_train_model()
        output = predict(query, artifact)
        print(json.dumps({"ok": True, "result": output}))
    except Exception as exc:  # pragma: no cover
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    cli()
