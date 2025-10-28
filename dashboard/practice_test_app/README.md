# SAT Practice Test Generator

This app generates full-length SAT practice tests from the classified question bank.

## Setup

Before running the app, you need to generate the classified questions file:

```bash
python3 << 'SCRIPT'
import json

# Load the SAT questions
data = json.load(open('SAT_Questions.json'))

classified = {}
for q_id, q in data.items():
    # Get domain from either field
    domain = q.get('domain') or q.get('primary_class_cd_desc', 'Unknown')
    module = q.get('module', 'Unknown')
    
    # Skip if no proper domain
    if domain == 'Unknown':
        continue
    
    # Normalize domain names to official SAT names
    domain_mapping = {
        'Craft and Structure': 'Craft and Structure',
        'Information and Ideas': 'Information and Ideas', 
        'Expression of Ideas': 'Expression of Ideas',
        'Standard English Conventions': 'Standard English Conventions',
        'Algebra': 'Algebra',
        'Advanced Math': 'Advanced Math',
        'Problem-Solving and Data Analysis': 'Problem-Solving and Data Analysis',
        'Geometry and Trigonometry': 'Geometry and Trigonometry'
    }
    
    if domain in domain_mapping:
        classified[q_id] = {
            'id': q_id,
            'domain': domain_mapping[domain],
            'module': module,
            'question': q.get('question', {}),
            'content': q.get('content', {}),
            'visuals': q.get('visuals', {}),
            'difficulty': q.get('difficulty', 'Medium')
        }

# Save to files directory
import os
os.makedirs('files', exist_ok=True)
with open('files/SAT_Questions_classified.json', 'w') as f:
    json.dump(classified, f, indent=2)

print(f'Classified {len(classified)} questions')
SCRIPT
```

## Features

- **Test Generation**: Creates full-length SAT tests with proper domain distribution
- **98 Questions**: 54 Reading & Writing + 44 Math
- **Official Domains**: Uses accurate SAT domain labels
- **Multiple Choice & Grid-in**: Supports both question types
- **Progress Tracking**: Visual progress bar and section indicators
- **Results Page**: Comprehensive score breakdown by section

## Structure

- `index.html` - Main UI
- `app.js` - Test generation logic and UI controller
- `style.css` - Custom styling
- `README.md` - This file

## Usage

1. Click "Start New SAT Practice Test" 
2. Answer questions using multiple choice or grid-in
3. Navigate with Previous/Next buttons
4. Submit test when complete
5. Review results with section breakdown
