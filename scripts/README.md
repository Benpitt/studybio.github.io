# Scripts

This directory contains utility scripts for maintaining the studying.works application.

## JavaScript Scripts

### `validate_questions.js`

Validates the SAT questions data file (`data/sat_questions.json`) against a defined JSON schema.

**Usage:**

```bash
# Using npm script
npm run validate-questions

# Or directly with node
node scripts/validate_questions.js
```

**Features:**

- **Schema Validation:** Ensures all questions have required fields with correct data types
- **Duplicate Detection:** Checks for duplicate question IDs
- **Multiple Choice Validation:** 
  - Verifies that Multiple Choice questions have an options array
  - Ensures at least 2 options are provided
  - Confirms the answer matches one of the provided options
- **Student-Produced Response Validation:** 
  - Verifies that these questions don't have options arrays
- **Domain Validation:** 
  - Warns about unrecognized domains for each section
- **Statistics:** Displays counts of questions by section and type

**Exit Codes:**

- `0`: All validations passed
- `1`: Validation errors found

### `classify_questions.js`

Classifies SAT questions into their respective domains and categories.

**Usage:**

```bash
node scripts/classify_questions.js
```

## Python Scripts

### `train_bkt.py`

Trains the Bayesian Knowledge Tracing (BKT) model using student interaction data.

**Usage:**

```bash
python3 scripts/train_bkt.py
```

### `export_firebase_bkt.py`

Exports BKT data from Firebase for analysis or backup.

**Usage:**

```bash
python3 scripts/export_firebase_bkt.py
```

### `merge_questions.py`

Merges multiple question datasets while handling duplicates and conflicts.

**Usage:**

```bash
python3 scripts/merge_questions.py
```

## Development

### JavaScript Scripts

The validation script uses [AJV (Another JSON Validator)](https://ajv.js.org/) for JSON schema validation.

To add new validation rules:

1. Update the `questionSchema` object in `validate_questions.js`
2. Or add custom validation logic in the `performAdditionalValidation()` function
3. Test your changes by running the validation script

### Python Scripts

Python scripts require Python 3.7+ and may have additional dependencies. Check individual script headers for requirements.
