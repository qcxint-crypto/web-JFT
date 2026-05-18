#!/usr/bin/env python3
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "database" / "processed_questions.json"
WEBSITE_OUTPUT_DIR = BASE_DIR / "website" / "output"
MERGED_OUTPUT_PATH = WEBSITE_OUTPUT_DIR / "all_questions.json"

def merge_questions():
    """Merge all questions from database/processed_questions.json into website/output/all_questions.json"""

    # Load questions from database
    if not DATABASE_PATH.exists():
        print("❌ database/processed_questions.json not found")
        return

    with open(DATABASE_PATH, 'r') as f:
        db_questions = json.load(f)

    # Convert dict to list format (database stores as hash -> question)
    questions_list = list(db_questions.values())

    print(f"📊 Loaded {len(questions_list)} questions from database")

    # Ensure output directory exists
    os.makedirs(WEBSITE_OUTPUT_DIR, exist_ok=True)

    # Write merged questions
    with open(MERGED_OUTPUT_PATH, 'w') as f:
        json.dump(questions_list, f, indent=2)

    print(f"✅ Merged {len(questions_list)} questions into {MERGED_OUTPUT_PATH}")

    # Show category breakdown
    categories = {}
    for q in questions_list:
        cat = q.get('category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1

    print("\n📂 Category breakdown:")
    for cat, count in sorted(categories.items()):
        print(f"  - {cat}: {count}")

if __name__ == "__main__":
    merge_questions()
