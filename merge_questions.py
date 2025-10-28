#!/usr/bin/env python3
"""
Merge and deduplicate SAT question datasets
"""
import json
import sys

def load_json(filepath):
    """Load JSON file"""
    with open(filepath) as f:
        return json.load(f)

def get_question_id(question):
    """Extract unique ID from question (handles different formats)"""
    # Try different ID fields
    if isinstance(question, dict):
        return (
            question.get('questionId') or
            question.get('uId') or
            question.get('id') or
            question.get('external_id')
        )
    return None

def merge_datasets(dataset1, dataset2):
    """Merge two datasets, removing duplicates based on question ID"""

    # Convert to dict format if needed
    if isinstance(dataset1, list):
        dataset1 = {get_question_id(q): q for q in dataset1 if get_question_id(q)}
    if isinstance(dataset2, list):
        dataset2 = {get_question_id(q): q for q in dataset2 if get_question_id(q)}

    # Track stats
    original_count = len(dataset1)
    new_count = len(dataset2)

    # Find duplicates
    duplicates = set(dataset1.keys()) & set(dataset2.keys())

    # Merge (dataset1 takes precedence for duplicates)
    merged = {**dataset2, **dataset1}

    print(f"Dataset 1: {original_count} questions")
    print(f"Dataset 2: {new_count} questions")
    print(f"Duplicates found: {len(duplicates)}")
    print(f"Unique questions after merge: {len(merged)}")

    if len(duplicates) > 0:
        print(f"\nSample duplicate IDs:")
        for dup_id in list(duplicates)[:5]:
            print(f"  - {dup_id}")

    return merged, len(duplicates)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 merge_questions.py <file1.json> <file2.json> <output.json>")
        sys.exit(1)

    file1, file2, output = sys.argv[1], sys.argv[2], sys.argv[3]

    print(f"Loading {file1}...")
    data1 = load_json(file1)

    print(f"Loading {file2}...")
    data2 = load_json(file2)

    print("\nMerging datasets...")
    merged, dup_count = merge_datasets(data1, data2)

    print(f"\nSaving to {output}...")
    with open(output, 'w') as f:
        json.dump(merged, f)

    print(f"✅ Done! Saved {len(merged)} unique questions")
