# Scripts

This directory contains utility scripts for maintaining the studying.works application.

## Available Scripts

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

**Example Output:**

```
🔍 Starting SAT Questions Validation...

✅ JSON file successfully parsed
✅ Schema validation passed
✅ Additional validation checks passed

📊 Statistics:
  Total questions: 15
  Reading & Writing: 5 questions
  Math: 10 questions

  Question types:
    Multiple Choice: 13 questions
    Student-Produced Response: 2 questions

✨ All validations passed successfully!
```

## Development

The validation script uses [AJV (Another JSON Validator)](https://ajv.js.org/) for JSON schema validation.

To add new validation rules:

1. Update the `questionSchema` object in `validate_questions.js`
2. Or add custom validation logic in the `performAdditionalValidation()` function
3. Test your changes by running the validation script
