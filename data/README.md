# SAT Questions Data

This directory contains structured SAT practice questions for the studying.works application.

## File Structure

### `sat_questions.json`

This file contains SAT practice questions organized by section and domain.

#### JSON Schema

Each question in the file follows this structure:

```json
{
  "id": "string",              // Unique identifier (e.g., "rw-001", "math-001")
  "section": "string",         // Either "Reading & Writing" or "Math"
  "domain": "string",          // Content domain (see domains below)
  "identifier": "string",      // Specific skill or topic
  "passage": "string|null",    // Text passage (required for most R&W questions)
  "question": "string",        // The question text
  "type": "string",            // "Multiple Choice" or "Student-Produced Response"
  "options": "array|null",     // Array of answer choices (for Multiple Choice)
  "answer": "string"           // The correct answer
}
```

#### Sections and Domains

**Reading & Writing:**
- Information and Ideas
- Craft and Structure
- Expression of Ideas
- Standard English Conventions

**Math:**
- Algebra
- Advanced Math
- Problem-Solving and Data Analysis
- Geometry and Trigonometry

## Validation

Before adding or modifying questions, run the validation script to ensure data integrity:

```bash
npm run validate-questions
```

Or directly:

```bash
node scripts/validate_questions.js
```

## Adding New Questions

When adding new questions:

1. Ensure each question has a unique `id`
2. Use the correct `section` value: "Reading & Writing" or "Math"
3. Select appropriate `domain` and `identifier` from the categories above
4. For Multiple Choice questions:
   - Include an `options` array with at least 2 choices
   - Ensure `answer` matches one of the options exactly
5. For Student-Produced Response questions:
   - Set `options` to `null`
   - Provide the numeric or text answer in the `answer` field
6. Run validation after changes: `npm run validate-questions`

## Example Questions

The file includes sample questions demonstrating:
- Various question types across both sections
- Different domains within each section
- Both Multiple Choice and Student-Produced Response formats
- Questions with and without passages
