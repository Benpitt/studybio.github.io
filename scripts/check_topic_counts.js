const fs = require('fs');
const path = require('path');

// Read the classified questions file
const questionsFile = path.join(__dirname, '../files/SAT_Questions_classified.json');
const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

console.log(`Total questions loaded: ${questions.length}`);

// Helper function to map domain to topic (same as in sat-practice.html)
function getDomainTopic(domain, module) {
    if (!domain) return 'other';
    const d = domain.toLowerCase();

    // Math topics - more specific categorization
    if (d.includes('algebra') && !d.includes('advanced')) return 'algebra';
    if (d.includes('advanced math')) return 'advanced-math';
    if (d.includes('problem-solving') || d.includes('data analysis')) return 'data-analysis';
    if (d.includes('geometry') && d.includes('trig')) return 'geometry-trig';
    if (d.includes('geometry')) return 'geometry';
    if (d.includes('trig')) return 'trigonometry';

    // Fallback for general math terms
    if (d.includes('equation') || d.includes('function') || d.includes('linear')) return 'algebra';

    // Reading & Writing topics
    if (d.includes('information and ideas')) return 'information-ideas';
    if (d.includes('craft and structure')) return 'craft-structure';
    if (d.includes('expression of ideas')) return 'expression-ideas';
    if (d.includes('standard english') || d.includes('conventions')) return 'english-conventions';

    // Fallback for general reading/writing terms
    if (d.includes('reading') || d.includes('comprehension') || d.includes('inference')) return 'reading';
    if (d.includes('writing') || d.includes('grammar') || d.includes('punctuation')) return 'writing';

    return 'other';
}

// Count questions per topic
const topicCounts = {};
const uniqueDomains = new Set();

questions.forEach(q => {
    uniqueDomains.add(q.domain);
    const qTopic = q.topic?.toLowerCase() || getDomainTopic(q.domain, q.module);
    topicCounts[qTopic] = (topicCounts[qTopic] || 0) + 1;
});

console.log('\n=== Topic Counts ===');
Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([topic, count]) => {
        console.log(`${topic.padEnd(25)}: ${count}`);
    });

console.log('\n=== Unique Domains in Data ===');
Array.from(uniqueDomains).sort().forEach(domain => {
    console.log(`- ${domain}`);
});

// Sample a few questions to see their domain values
console.log('\n=== Sample Questions ===');
questions.slice(0, 5).forEach(q => {
    const topic = getDomainTopic(q.domain, q.module);
    console.log(`Domain: "${q.domain}" -> Topic: "${topic}"`);
});
