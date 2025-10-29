#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../files/SAT_Questions_classified.json');
const OUTPUT_FILE = path.join(__dirname, '../files/SAT_Questions_classified.json');

console.log('Reading classified questions from:', INPUT_FILE);

// Read the file
const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
const questions = JSON.parse(rawData);

console.log('Total questions:', questions.length);

let fixedCount = 0;

// Fix question types based on options
const fixedQuestions = questions.map(q => {
  // If options is empty or null, it should be Student-Produced Response
  if (!q.options || q.options.length === 0) {
    if (q.type !== 'Student-Produced Response') {
      fixedCount++;
      return {
        ...q,
        type: 'Student-Produced Response'
      };
    }
  }
  // If options has items, it should be Multiple Choice
  else if (q.options.length > 0) {
    if (q.type !== 'Multiple Choice') {
      fixedCount++;
      return {
        ...q,
        type: 'Multiple Choice'
      };
    }
  }

  return q;
});

console.log('Fixed', fixedCount, 'question types');

// Count by type
const typeCounts = {};
fixedQuestions.forEach(q => {
  typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
});

console.log('\nQuestion type breakdown:');
Object.entries(typeCounts).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Write back to file
console.log('\nWriting updated questions to:', OUTPUT_FILE);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fixedQuestions, null, 2), 'utf8');

console.log('✅ Done!');
