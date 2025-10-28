#!/usr/bin/env python3
"""
Merge and deduplicate SAT question datasets
"""
import json
import sys
import hashlib

def load_json(filepath):
    """Load JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_content_hash(question):
    """Generate a unique ID based on question content"""
    if isinstance(question, dict):
        # Use question text or stem for hash
        content = question.get('stem') or question.get('question') or question.get('content')
        if content and isinstance(content, dict):
            content = str(content)
        elif not content:
            content = str(question)
        return hashlib.md5(str(content).encode('utf-8')).hexdigest()[:16]
    return hashlib.md5(str(question).encode('utf-8')).hexdigest()[:16]

def get_question_id(question):
    """Extract unique ID from question (handles different formats)"""
    # Try different ID fields
    if isinstance(question, dict):
        existing_id = (
            question.get('questionId') or
            question.get('uId') or
            question.get('id') or
            question.get('external_id')
        )
        # If ID looks like a placeholder, generate content-based ID
        if existing_id and ('random_id' in str(existing_id) or 'placeholder' in str(existing_id)):
            return generate_content_hash(question)
        return existing_id or generate_content_hash(question)
    return None

def normalize_dataset(data):
    """Convert dataset to dict format with proper IDs"""
    result = {}

    if not isinstance(data, dict):
        # Handle list of questions
        if isinstance(data, list):
            for q in data:
                q_id = get_question_id(q)
                if q_id:
                    result[q_id] = q
        return result

    # Check first few values to determine format
    sample_values = list(data.values())[:5]

    # Check if this is a category-based format (all values are lists)
    if all(isinstance(v, list) for v in sample_values):
        # This looks like {math: [...], english: [...]}
        for category, questions in data.items():
            if isinstance(questions, list):
                for q in questions:
                    q_id = get_question_id(q)
                    if q_id:
                        result[q_id] = q
    else:
        # This is a dict of questions (CB format: {uuid: question, ...})
        for key, q in data.items():
            if isinstance(q, dict):
                q_id = get_question_id(q)
                if q_id:
                    result[q_id] = q

    return result

def merge_datasets(dataset1, dataset2):
    """Merge two datasets, removing duplicates based on question ID"""

    # Normalize both datasets
    dataset1 = normalize_dataset(dataset1)
    dataset2 = normalize_dataset(dataset2)

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
    with open(output, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"✅ Done! Saved {len(merged)} unique questions")

    # Verify the output is valid JSON
    print("\nVerifying output...")
    with open(output, 'r', encoding='utf-8') as f:
        verify = json.load(f)
    print(f"✅ Verification passed! File contains {len(verify)} questions")
