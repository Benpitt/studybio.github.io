#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path configuration
const INPUT_FILE = path.join(__dirname, '../files/SAT_Questions.json');
const OUTPUT_FILE = path.join(__dirname, '../files/SAT_Questions_classified.json');

// Domain to Section mapping
const MATH_DOMAINS = [
  'Advanced Math',
  'Algebra',
  'Problem-Solving and Data Analysis',
  'Geometry and Trigonometry'
];

const READING_WRITING_DOMAINS = [
  'Information and Ideas',
  'Craft and Structure',
  'Expression of Ideas',
  'Standard English Conventions'
];

/**
 * Determine section based on domain or module
 */
function determineSection(item) {
  // Check NEW structure first
  if (item.domain) {
    if (MATH_DOMAINS.includes(item.domain)) {
      return 'Math';
    }
    if (READING_WRITING_DOMAINS.includes(item.domain)) {
      return 'Reading & Writing';
    }
    // Default fallback
    return 'Math';
  }
  
  // Check OLD structure
  if (item.module) {
    return item.module === 'math' ? 'Math' : 'Reading & Writing';
  }
  
  return null; // Not a valid question
}

/**
 * Extract question text from various formats
 */
function extractQuestion(item) {
  // NEW simple structure - question field is a string
  if (item.question && typeof item.question === 'string') {
    return item.question;
  }

  // NEW structure - nested question object
  if (item.question && item.question.question) {
    return item.question.question;
  }

  // OLD structure - check for prompt first
  if (item.content && item.content.prompt) {
    return item.content.prompt;
  }

  // OLD structure - alternative stimulus field
  if (item.content && item.content.stimulus) {
    return item.content.stimulus;
  }

  return '';
}

/**
 * Extract passage text from various formats
 */
function extractPassage(item) {
  // NEW simple structure - passage field directly
  if (item.passage !== undefined && item.passage !== null && item.passage !== 'null') {
    return item.passage;
  }

  // NEW structure - nested paragraph
  if (item.question && item.question.paragraph && item.question.paragraph !== 'null') {
    return item.question.paragraph;
  }

  // OLD structure
  if (item.content && item.content.passage) {
    return item.content.passage;
  }

  return null;
}

/**
 * Determine question type
 */
function determineType(item) {
  // NEW structure - use type field directly if available
  if (item.type) {
    return item.type;
  }

  // OLD structure - check if it's a student-produced response (grid-in)
  if (item.content && item.content.item_format === 'FITB') {
    return 'Student-Produced Response';
  }

  return 'Multiple Choice';
}

/**
 * Extract options/choices
 */
function extractOptions(item) {
  // NEW simple structure - array of option strings
  if (item.options && Array.isArray(item.options)) {
    // If options is null (for Student-Produced Response), return empty array
    if (item.options === null) {
      return [];
    }
    // If options are simple strings, convert to labeled format
    return item.options.map((text, idx) => ({
      label: String.fromCharCode(65 + idx), // A, B, C, D
      text: text
    }));
  }

  // NEW structure - nested choices object
  if (item.question && item.question.choices) {
    const choices = item.question.choices;
    return Object.keys(choices).map(key => ({
      label: key,
      text: choices[key]
    }));
  }

  // OLD structure - choices in answer object
  if (item.content && item.content.answer && item.content.answer.choices) {
    const options = item.content.answer.choices;
    return Object.keys(options).map(key => ({
      label: key.toUpperCase(),
      text: options[key].body || options[key]
    }));
  }

  // OLD structure - multiple_choice_options
  if (item.content && item.content.multiple_choice_options) {
    const options = item.content.multiple_choice_options;
    return Object.keys(options).map(key => ({
      label: key.toUpperCase(),
      text: options[key].body || options[key]
    }));
  }

  return [];
}

/**
 * Extract correct answer
 */
function extractAnswer(item) {
  // NEW simple structure - answer field directly
  if (item.answer) {
    return item.answer;
  }

  // NEW structure - nested correct_answer
  if (item.question && item.question.correct_answer) {
    return item.question.correct_answer;
  }

  // OLD structure - correct_choice in answer object
  if (item.content && item.content.answer && item.content.answer.correct_choice) {
    return item.content.answer.correct_choice.toUpperCase();
  }

  // OLD structure - direct correct_choice
  if (item.content && item.content.correct_choice) {
    return item.content.correct_choice.toUpperCase();
  }

  return '';
}

/**
 * Determine domain
 */
function determineDomain(item) {
  // NEW structure has domain directly
  if (item.domain) {
    return item.domain;
  }
  
  // OLD structure uses primary_class_cd_desc
  if (item.primary_class_cd_desc) {
    return item.primary_class_cd_desc;
  }
  
  return '';
}

/**
 * Determine identifier (skill)
 */
function determineIdentifier(item) {
  // NEW simple structure - identifier field directly
  if (item.identifier) {
    return item.identifier;
  }

  // NEW structure - nested skill
  if (item.question && item.question.skill) {
    return item.question.skill;
  }

  // OLD structure has skill_desc
  if (item.skill_desc) {
    return item.skill_desc;
  }

  // Fallback to domain if no specific skill
  return determineDomain(item);
}

/**
 * Check if item is a valid question
 */
function isValidQuestion(item) {
  // Skip practice test metadata
  if (item.name && (item.module_1 || item.module_2)) {
    return false;
  }
  
  // Must have either module or domain
  if (!item.module && !item.domain) {
    return false;
  }
  
  // Must have question content
  const question = extractQuestion(item);
  if (!question || question.trim().length === 0) {
    return false;
  }
  
  return true;
}

/**
 * Classify and normalize a single question
 */
function classifyQuestion(key, item) {
  if (!isValidQuestion(item)) {
    return null;
  }
  
  const section = determineSection(item);
  if (!section) {
    return null;
  }
  
  const domain = determineDomain(item);
  const identifier = determineIdentifier(item);
  const question = extractQuestion(item);
  const passage = extractPassage(item);
  const type = determineType(item);
  const options = extractOptions(item);
  const answer = extractAnswer(item);
  
  return {
    id: item.id || item.questionId || key,
    section,
    domain,
    identifier,
    question,
    passage,
    type,
    options,
    answer
  };
}

/**
 * Main classification function
 */
function classifyQuestions() {
  console.log('Reading SAT Questions from:', INPUT_FILE);

  // Read input file
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(rawData);

  // Handle different data formats
  let questionsArray = [];
  if (data.questions && Array.isArray(data.questions)) {
    // New format: { "questions": [...] }
    questionsArray = data.questions;
    console.log('Total entries in input file:', questionsArray.length);
  } else if (Array.isArray(data)) {
    // Array format: [...]
    questionsArray = data;
    console.log('Total entries in input file:', questionsArray.length);
  } else {
    // Object format: { "id1": {...}, "id2": {...} }
    questionsArray = Object.values(data);
    console.log('Total entries in input file:', questionsArray.length);
  }

  // Process each question
  const classified = [];
  let processed = 0;
  let skipped = 0;

  for (let i = 0; i < questionsArray.length; i++) {
    const item = questionsArray[i];
    const key = item.id || `question_${i}`;
    const classifiedQuestion = classifyQuestion(key, item);

    if (classifiedQuestion) {
      classified.push(classifiedQuestion);
      processed++;
    } else {
      skipped++;
    }
  }
  
  console.log('Processed questions:', processed);
  console.log('Skipped entries:', skipped);
  
  // Write output file
  console.log('Writing classified questions to:', OUTPUT_FILE);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(classified, null, 2), 'utf8');
  
  console.log('Classification complete!');
  console.log('Total classified questions:', classified.length);
  
  // Print summary statistics
  const sectionCounts = {};
  const domainCounts = {};
  
  classified.forEach(q => {
    sectionCounts[q.section] = (sectionCounts[q.section] || 0) + 1;
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
  });
  
  console.log('\nSection breakdown:');
  Object.entries(sectionCounts).forEach(([section, count]) => {
    console.log(`  ${section}: ${count}`);
  });
  
  console.log('\nDomain breakdown:');
  Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count}`);
  });
}

// Run the classification
try {
  classifyQuestions();
} catch (error) {
  console.error('Error during classification:', error);
  process.exit(1);
}
