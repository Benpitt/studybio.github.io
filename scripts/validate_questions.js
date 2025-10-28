#!/usr/bin/env node

/**
 * SAT Questions Validation Script
 * 
 * This script validates the sat_questions.json file against a defined JSON schema
 * to ensure data integrity and consistency across all questions.
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

// Initialize AJV (JSON Schema validator)
const ajv = new Ajv({ allErrors: true });

// Define the JSON schema for SAT questions
const questionSchema = {
  type: 'object',
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'section', 'domain', 'identifier', 'question', 'type', 'answer'],
        properties: {
          id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9-]+$',
            description: 'Unique identifier for the question'
          },
          section: {
            type: 'string',
            enum: ['Reading & Writing', 'Math'],
            description: 'The SAT section: Reading & Writing or Math'
          },
          domain: {
            type: 'string',
            description: 'Content domain (e.g., Information and Ideas, Algebra)'
          },
          identifier: {
            type: 'string',
            description: 'Specific skill or topic identifier'
          },
          passage: {
            type: ['string', 'null'],
            description: 'Text passage for Reading & Writing questions (optional for Math)'
          },
          question: {
            type: 'string',
            minLength: 1,
            description: 'The question text'
          },
          type: {
            type: 'string',
            enum: ['Multiple Choice', 'Student-Produced Response'],
            description: 'Question type'
          },
          options: {
            type: ['array', 'null'],
            items: {
              type: 'string'
            },
            description: 'Answer options for multiple choice questions'
          },
          answer: {
            type: 'string',
            minLength: 1,
            description: 'The correct answer'
          }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};

// Compile the schema
const validate = ajv.compile(questionSchema);

/**
 * Additional validation checks beyond schema validation
 */
function performAdditionalValidation(data) {
  const errors = [];
  const ids = new Set();

  data.questions.forEach((question, index) => {
    // Check for duplicate IDs
    if (ids.has(question.id)) {
      errors.push(`Duplicate question ID found: ${question.id} at index ${index}`);
    }
    ids.add(question.id);

    // Validate Multiple Choice questions have options
    if (question.type === 'Multiple Choice') {
      if (!question.options || !Array.isArray(question.options)) {
        errors.push(`Question ${question.id}: Multiple Choice questions must have an options array`);
      } else if (question.options.length < 2) {
        errors.push(`Question ${question.id}: Multiple Choice questions must have at least 2 options`);
      } else if (!question.options.includes(question.answer)) {
        errors.push(`Question ${question.id}: Answer "${question.answer}" must be one of the provided options`);
      }
    }

    // Validate Student-Produced Response questions
    if (question.type === 'Student-Produced Response') {
      if (question.options !== null) {
        errors.push(`Question ${question.id}: Student-Produced Response questions should not have options`);
      }
    }

    // Validate Reading & Writing questions typically have passages
    if (question.section === 'Reading & Writing' && 
        question.domain !== 'Standard English Conventions' && 
        !question.passage) {
      console.warn(`Warning: Question ${question.id} in Reading & Writing section has no passage`);
    }

    // Validate recognized domains
    const validDomains = {
      'Reading & Writing': [
        'Information and Ideas',
        'Craft and Structure',
        'Expression of Ideas',
        'Standard English Conventions'
      ],
      'Math': [
        'Algebra',
        'Advanced Math',
        'Problem-Solving and Data Analysis',
        'Geometry and Trigonometry'
      ]
    };

    if (validDomains[question.section] && !validDomains[question.section].includes(question.domain)) {
      console.warn(`Warning: Question ${question.id} has unrecognized domain "${question.domain}" for section "${question.section}"`);
    }
  });

  return errors;
}

/**
 * Main validation function
 */
function validateQuestionsFile(filePath) {
  console.log('🔍 Starting SAT Questions Validation...\n');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at ${filePath}`);
    process.exit(1);
  }

  // Read and parse the JSON file
  let data;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(fileContent);
    console.log('✅ JSON file successfully parsed');
  } catch (error) {
    console.error(`❌ Error parsing JSON file: ${error.message}`);
    process.exit(1);
  }

  // Validate against schema
  const valid = validate(data);
  
  if (!valid) {
    console.error('\n❌ Schema Validation Errors:');
    validate.errors.forEach(error => {
      console.error(`  - ${error.instancePath || 'root'}: ${error.message}`);
      if (error.params) {
        console.error(`    Details: ${JSON.stringify(error.params)}`);
      }
    });
    process.exit(1);
  }
  
  console.log('✅ Schema validation passed');

  // Perform additional validation checks
  const additionalErrors = performAdditionalValidation(data);
  
  if (additionalErrors.length > 0) {
    console.error('\n❌ Additional Validation Errors:');
    additionalErrors.forEach(error => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Additional validation checks passed');

  // Print statistics
  console.log('\n📊 Statistics:');
  console.log(`  Total questions: ${data.questions.length}`);
  
  const sectionCounts = data.questions.reduce((acc, q) => {
    acc[q.section] = (acc[q.section] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(sectionCounts).forEach(([section, count]) => {
    console.log(`  ${section}: ${count} questions`);
  });

  const typeCounts = data.questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n  Question types:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`    ${type}: ${count} questions`);
  });

  console.log('\n✨ All validations passed successfully!');
  return true;
}

// Main execution
if (require.main === module) {
  const filePath = path.join(__dirname, '..', 'data', 'sat_questions.json');
  validateQuestionsFile(filePath);
}

module.exports = { validateQuestionsFile };
