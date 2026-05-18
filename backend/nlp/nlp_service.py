import json
import re
import string
import sys
from typing import Dict, List

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

INTENT_TRAINING_DATA: Dict[str, List[str]] = {
    "RENT_SEARCH": [
        "show me rental cameras",
        "find bikes for rent",
        "search for power tools to rent",
        "what items are available for rental",
        "i need to browse rental products",
        "find equipment near me",
        "show available generators",
        "list all rental items",
        "what can i rent today",
        "search rental options in my area",
        "show some clothes for rent",
        "show some cloths for rent",
        "show clothes",
        "show dresses",
        "dress to rent",
        "outfits for rent",
        "i need clothing for rent",
        "rent a suit",
        "suggest tools for home repair",
        "recommend tools for home maintenance",
        "suggest heavy duty tools",
        "show me power tools for rent",
        "find repair tools on rent",
        "recommend construction equipment to rent",
        "show rental tools near me",
        "i want suggestions for rental tools",
    ],
    "RENT_ITEM": [
        "i want to rent this camera",
        "book the drill for 3 days",
        "rent this bike now",
        "i need this item for 2 weeks",
        "help me complete booking",
        "reserve this generator",
        "can i rent this product",
        "start my rental order",
        "i want to proceed with rent",
        "take me to booking page",
        "rent this dress",
        "rent a wedding outfit",
        "book a suit for 2 days",
    ],
    "RETURN_ITEM": [
        "i want to return my rented item",
        "start return process",
        "how do i return the camera",
        "schedule pickup for return",
        "i need to give back this product",
        "open return form",
        "return my rental today",
        "help me submit return request",
        "take me to return page",
        "i am done using the item",
    ],
    "REPORT_DAMAGE": [
        "the item is damaged",
        "i want to report damage",
        "camera lens got cracked",
        "the tool is broken",
        "file a damage complaint",
        "report an issue with rented item",
        "product came with scratches",
        "open damage report form",
        "i need to report a fault",
        "there is physical damage on item",
    ],
    "CHECK_STATUS": [
        "check my rental status",
        "where is my order",
        "track my rental",
        "what is my booking status",
        "has my request been approved",
        "show current order progress",
        "is my item delivered",
        "status of my return request",
        "tell me order update",
        "check status of my rental",
        "show my orders",
        "my orders",
        "order history",
    ],
}

STOP_WORDS = set(ENGLISH_STOP_WORDS)


def preprocess_text(text: str) -> str:
    lowered = text.lower()
    no_punct = lowered.translate(str.maketrans("", "", string.punctuation))
    tokens = [token for token in no_punct.split() if token and token not in STOP_WORDS]
    return " ".join(tokens)


def extract_entities(text: str) -> Dict[str, str]:
    duration_match = re.search(r"\b(\d+\s*(?:day|days|week|weeks|month|months))\b", text, re.IGNORECASE)
    location_match = re.search(r"\bnear\s+([A-Za-z][A-Za-z\s]{1,40})\b", text, re.IGNORECASE)

    duration = duration_match.group(1).strip() if duration_match else None
    location = None
    if location_match:
        location = f"near {location_match.group(1).strip()}"

    return {
        "duration": duration,
        "location": location,
    }


def train_classifier():
    train_texts: List[str] = []
    labels: List[str] = []

    for intent, phrases in INTENT_TRAINING_DATA.items():
        for phrase in phrases:
            train_texts.append(preprocess_text(phrase))
            labels.append(intent)

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    features = vectorizer.fit_transform(train_texts)

    classifier = MultinomialNB(alpha=0.25)
    classifier.fit(features, labels)

    return vectorizer, classifier


def classify_message(message: str) -> Dict:
    vectorizer, classifier = train_classifier()
    clean_input = preprocess_text(message)

    if not clean_input:
        return {
            "intent": "UNKNOWN",
            "confidence": 0.0,
            "entities": extract_entities(message),
            "fallback": True,
        }

    vector = vectorizer.transform([clean_input])
    probabilities = classifier.predict_proba(vector)[0]
    classes = classifier.classes_

    best_index = probabilities.argmax()
    confidence = float(probabilities[best_index])
    intent = classes[best_index]

    return {
        "intent": intent,
        "confidence": round(confidence, 4),
        "entities": extract_entities(message),
        "fallback": confidence < 0.45,
    }


def main():
    try:
        message = sys.stdin.read().strip()
        if not message:
            print(
                json.dumps(
                    {
                        "intent": "UNKNOWN",
                        "confidence": 0.0,
                        "entities": {"duration": None, "location": None},
                        "fallback": True,
                    }
                )
            )
            return

        output = classify_message(message)
        print(json.dumps(output))
    except Exception:
        print(
            json.dumps(
                {
                    "intent": "UNKNOWN",
                    "confidence": 0.0,
                    "entities": {"duration": None, "location": None},
                    "fallback": True,
                }
            )
        )


if __name__ == "__main__":
    main()
