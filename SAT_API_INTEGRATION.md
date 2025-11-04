# SAT API Integration Documentation

## Overview

The SAT Practice application now integrates with the PracticeSAT API to fetch questions dynamically instead of using static JSON files.

## API Endpoints

### 1. Get Questions
```
GET https://practicesat.vercel.app/api/get-questions?domains={DOMAIN_CODE}
```

Fetches SAT questions for a specific domain.

**Domain Codes:**
- `H` - Heart of Algebra (algebra)
- `P` - Problem-Solving and Data Analysis (data-analysis)
- `A` - Advanced Math (advanced-math)
- `G` - Geometry and Trigonometry (geometry-trig)
- `I` - Information and Ideas (information-ideas)
- `C` - Craft and Structure (craft-structure)
- `E` - Expression of Ideas (expression-ideas)
- `S` - Standard English Conventions (english-conventions)

**Example:**
```javascript
fetch('https://practicesat.vercel.app/api/get-questions?domains=H')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 2. Lookup Endpoint
```
GET https://practicesat.vercel.app/api/lookup
```

This endpoint can be used for looking up specific question details. (Currently not implemented in the application but available for future use)

## Implementation Details

### Question Loading Flow

1. **Primary Method - API Fetch**
   - On application load, the app fetches questions from all 8 domain categories
   - Each domain is fetched separately and combined into a single question bank
   - Questions are parsed and normalized into a consistent format

2. **Fallback Method - Local JSON**
   - If the API fails or returns no questions, the app falls back to `data/sat_questions.json`
   - This ensures the app continues to work even if the API is unavailable

3. **Last Resort - Sample Questions**
   - If both API and local JSON fail, the app uses hardcoded sample questions
   - This ensures the app never shows an empty state

### Response Parsing

The API integration handles multiple response formats:
```javascript
// Array format
[{...}, {...}]

// Object with questions property
{ questions: [{...}, {...}] }

// Object with data property
{ data: [{...}, {...}] }

// Plain object (converted to array)
{ "q1": {...}, "q2": {...} }
```

### Question Data Mapping

API responses are normalized to the following format:
```javascript
{
  id: string,              // Unique question identifier
  topic: string,           // Topic category for filtering
  domain: string,          // Domain name for display
  question: string,        // The question text
  passage: string | null,  // Optional reading passage
  choices: string[] | null,// Answer choices (null for free response)
  correct: string,         // Correct answer
  explanation: string,     // Answer explanation
  difficulty: string,      // Question difficulty level
  format: 'api'           // Source indicator
}
```

### Field Mapping from API

The parser handles various field names from different API formats:

| Our Format | Possible API Fields |
|------------|-------------------|
| `question` | `question`, `stem`, `questionText`, `text` |
| `passage` | `passage`, `context`, `paragraph` |
| `choices` | `choices`, `options`, `answerChoices`, `answers` |
| `correct` | `answer`, `correctAnswer`, `correct` |
| `explanation` | `explanation`, `rationale`, `solution` |

### Topic Mapping

Domain codes are mapped to internal topic IDs used for filtering:

```javascript
const domainMap = {
  'H': 'algebra',
  'P': 'data-analysis',
  'A': 'advanced-math',
  'G': 'geometry-trig',
  'I': 'information-ideas',
  'C': 'craft-structure',
  'E': 'expression-ideas',
  'S': 'english-conventions'
};
```

## Error Handling

The integration includes comprehensive error handling:

1. **Per-Domain Errors**: If one domain fails, others continue loading
2. **API Failure**: Automatic fallback to local JSON
3. **Complete Failure**: Sample questions ensure app functionality
4. **Console Logging**: Detailed logs for debugging

## Testing the Integration

To test the API integration:

1. Open the SAT Practice page in a browser
2. Open the browser's Developer Console (F12)
3. Look for console messages:
   - `✅ Loaded questions for domain X` - Successful API calls
   - `✅ Total questions loaded from API: N` - Total count
   - Any warnings or errors will also be logged

## Future Enhancements

Potential improvements for the API integration:

1. **Question Lookup**: Implement the `/api/lookup` endpoint for fetching specific questions
2. **Caching**: Cache API responses in localStorage to reduce API calls
3. **Pagination**: If the API supports it, implement pagination for large question sets
4. **Rate Limiting**: Add rate limiting to respect API quotas
5. **Progress Tracking**: Store user progress on answered questions
6. **Difficulty Filtering**: Allow users to filter by difficulty level

## Troubleshooting

### Questions Not Loading

1. Check browser console for errors
2. Verify internet connection
3. Check if API is accessible: `https://practicesat.vercel.app/api/get-questions?domains=H`
4. Fallback to local JSON should activate automatically

### Missing Questions

- Some domains may have fewer questions than others
- Check console logs to see how many questions loaded per domain
- Verify domain codes are correct

### Format Issues

- The parser handles multiple formats automatically
- If questions display incorrectly, check console logs for parsing errors
- Report any new formats to update the parser

## Code Location

The API integration code is located in `/home/user/studying.works/sat-practice.html`:

- **Loading Logic**: Lines 512-677 (useEffect hook)
- **API Parsing**: Lines 557-629 (parseAPIResponse function)
- **Fallback Logic**: Lines 646-674 (loadFallbackQuestions function)

## Contact & Support

For issues with the PracticeSAT API itself, contact the API provider.
For issues with the integration, check the console logs and refer to this documentation.
