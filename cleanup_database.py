#!/usr/bin/env python3
"""Clean invalid questions from database and regenerate output."""

import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "database" / "processed_questions.json"
INVALID_BACKUP_PATH = BASE_DIR / "database" / "invalid_entries_backup.json"
WEBSITE_OUTPUT_DIR = BASE_DIR / "website" / "output"
MERGED_OUTPUT_PATH = WEBSITE_OUTPUT_DIR / "all_questions.json"

class DatabaseCleaner:
    def _is_valid_question(self, question_text, choices):
        """Check if extracted content is a valid multiple choice question."""
        if not choices or len(choices) < 2:
            return False

        # Extract text for pattern matching if choices are objects
        choices_texts = [c.get("text", "") if isinstance(c, dict) else str(c) for c in choices]

        q_lower = question_text.lower().strip() if question_text else ""

        # ALWAYS INVALID: Section headers and common placeholder text
        invalid_patterns = [
            "bagian tanpa judul",
            "sesi ",
            "session ",
            "part ",
            "bagian ",
            "halaman ",
            "page ",
            "untitled",
            "no title",
            "question_",
            "informasi pribadi",
            "identitas",
            "biodata",
            "nama lengkap",
            "nomor absen",
            "kelas",
        ]
        
        if any(pattern in q_lower for pattern in invalid_patterns):
            return False

        # If we have choices, it's highly likely to be a question
        return True

    def clean_database(self):
        """Clean invalid questions from database."""
        if not DATABASE_PATH.exists():
            print("❌ Database not found")
            return False

        try:
            with open(DATABASE_PATH, 'r') as f:
                all_questions = json.load(f)

            valid_questions = {}
            invalid_questions = []

            print(f"Checking {len(all_questions)} questions...")

            for q_hash, question_data in all_questions.items():
                q_text = question_data.get("question", "")
                choices = question_data.get("choices", [])

                if self._is_valid_question(q_text, choices):
                    valid_questions[q_hash] = question_data
                else:
                    invalid_questions.append({
                        "hash": q_hash,
                        "question": q_text[:60],
                        "choices_count": len(choices)
                    })

            removed_count = len(invalid_questions)
            kept_count = len(valid_questions)

            print(f"\n{'='*60}")
            print(f"CLEANUP RESULTS:")
            print(f"  ✓ Valid questions: {kept_count}")
            print(f"  ✗ Invalid entries: {removed_count}")
            print(f"{'='*60}\n")

            if removed_count > 0:
                print(f"Removed invalid entries:")
                for inv in invalid_questions[:15]:
                    print(f"  ✗ '{inv['question']}' ({inv['choices_count']} choices)")
                if len(invalid_questions) > 15:
                    print(f"  ... and {len(invalid_questions) - 15} more")

                # Save cleaned database
                with open(DATABASE_PATH, 'w') as f:
                    json.dump(valid_questions, f, indent=2)

                # Backup invalid
                with open(INVALID_BACKUP_PATH, 'w') as f:
                    json.dump(invalid_questions, f, indent=2)

                print(f"\n✓ Database cleaned and saved")
                print(f"✓ Invalid entries backed up to {INVALID_BACKUP_PATH}")
                return True
            else:
                print("✓ Database is clean, no invalid entries found")
                return True

        except Exception as e:
            print(f"❌ Error: {e}")
            return False

    def regenerate_output(self):
        """Regenerate website/output/all_questions.json from cleaned database."""

        if not DATABASE_PATH.exists():
            print("❌ Database not found")
            return False

        try:
            with open(DATABASE_PATH, 'r') as f:
                db_questions = json.load(f)

            # Convert dict to list
            questions_list = list(db_questions.values())

            os.makedirs(WEBSITE_OUTPUT_DIR, exist_ok=True)

            with open(MERGED_OUTPUT_PATH, 'w') as f:
                json.dump(questions_list, f, indent=2)

            print(f"✓ Regenerated {MERGED_OUTPUT_PATH} with {len(questions_list)} questions")

            # Show category breakdown
            categories = {}
            for q in questions_list:
                cat = q.get('category', 'unknown')
                categories[cat] = categories.get(cat, 0) + 1

            print("\nCategory breakdown:")
            for cat, count in sorted(categories.items()):
                print(f"  • {cat}: {count}")

            return True

        except Exception as e:
            print(f"❌ Error: {e}")
            return False

if __name__ == "__main__":
    cleaner = DatabaseCleaner()

    print("\n" + "="*60)
    print("DATABASE CLEANUP TOOL")
    print("="*60 + "\n")

    # Step 1: Clean database
    print("STEP 1: Cleaning database...")
    if cleaner.clean_database():
        print("\n✓ Database cleanup complete")
    else:
        exit(1)

    # Step 2: Regenerate output
    print("\nSTEP 2: Regenerating output...")
    if cleaner.regenerate_output():
        print("\n✓ Output regenerated")
    else:
        exit(1)

    print("\n" + "="*60)
    print("✓ All done! Refresh web to see cleaned data")
    print("="*60 + "\n")
