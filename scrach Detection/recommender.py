import sys
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def generate_recommendations(target_item_id, catalog):
    item_ids = []
    text_corpus = []

    for item in catalog:
        item_id = str(item.get('_id', item.get('id')))
        item_ids.append(item_id)

        category = item.get('category', '')
        name = item.get('name', '')
        desc = item.get('description', '')

        combined_text = f"{category} {category} {name} {desc}"
        text_corpus.append(combined_text)

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(text_corpus)

    similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

    try:
        target_index = item_ids.index(str(target_item_id))
    except ValueError:
        return {
            "success": False,
            "error": "Target item not found in database."
        }

    scores = list(enumerate(similarity_matrix[target_index]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)

    top_4_matches = scores[1:5]

    recommended_ids = [item_ids[i[0]] for i in top_4_matches]

    return {
        "success": True,
        "target_id": target_item_id,
        "recommendations": recommended_ids
    }

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()

        if not input_data:
            print(json.dumps({
                "success": False,
                "error": "No data received."
            }))
            sys.exit(1)

        payload = json.loads(input_data)

        target_id = payload.get("target_id")
        items_catalog = payload.get("items", [])

        results = generate_recommendations(target_id, items_catalog)

        print(json.dumps(results))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))