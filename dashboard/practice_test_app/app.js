// SAT Practice Test Generator
// This app generates full-length SAT practice tests from the classified question bank

class SATTestGenerator {
    constructor() {
        this.questions = null;
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.testConfig = {
            readingWriting: {
                total: 54,
                domains: {
                    'Information and Ideas': { min: 13, max: 15 },
                    'Craft and Structure': { min: 13, max: 15 },
                    'Expression of Ideas': { min: 11, max: 13 },
                    'Standard English Conventions': { min: 11, max: 13 }
                }
            },
            math: {
                total: 44,
                domains: {
                    'Algebra': { min: 13, max: 15 },
                    'Advanced Math': { min: 13, max: 15 },
                    'Problem-Solving and Data Analysis': { min: 5, max: 7 },
                    'Geometry and Trigonometry': { min: 5, max: 7 }
                }
            }
        };
    }

    async loadQuestions() {
        try {
            const response = await fetch('/files/SAT_Questions_classified.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.questions = await response.json();
            console.log('Loaded questions:', Object.keys(this.questions).length);
            return true;
        } catch (error) {
            console.error('Error loading questions:', error);
            return false;
        }
    }

    generateTest() {
        if (!this.questions) {
            console.error('Questions not loaded');
            return null;
        }

        const test = {
            readingWriting: [],
            math: [],
            metadata: {
                generatedAt: new Date().toISOString(),
                totalQuestions: 98
            }
        };

        // Generate Reading & Writing section
        const rwQuestions = this.selectQuestionsByDomain(
            this.testConfig.readingWriting.domains,
            this.testConfig.readingWriting.total,
            ['Information and Ideas', 'Craft and Structure', 'Expression of Ideas', 'Standard English Conventions']
        );
        test.readingWriting = rwQuestions;

        // Generate Math section
        const mathQuestions = this.selectQuestionsByDomain(
            this.testConfig.math.domains,
            this.testConfig.math.total,
            ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry']
        );
        test.math = mathQuestions;

        // Shuffle questions within each section
        test.readingWriting = this.shuffleArray(test.readingWriting);
        test.math = this.shuffleArray(test.math);

        this.currentTest = test;
        return test;
    }

    selectQuestionsByDomain(domainConfig, totalQuestions, domainList) {
        const selectedQuestions = [];
        const questionsByDomain = {};

        // Group questions by domain
        for (const [id, question] of Object.entries(this.questions)) {
            const domain = question.domain;
            if (domainList.includes(domain)) {
                if (!questionsByDomain[domain]) {
                    questionsByDomain[domain] = [];
                }
                questionsByDomain[domain].push({ ...question, id });
            }
        }

        // Select questions from each domain
        for (const domain of domainList) {
            const config = domainConfig[domain];
            const availableQuestions = questionsByDomain[domain] || [];
            
            // Calculate target based on proportion
            const targetCount = Math.min(
                config.max,
                Math.max(config.min, Math.floor(availableQuestions.length * 0.1))
            );

            // Randomly select questions
            const shuffled = this.shuffleArray([...availableQuestions]);
            const selected = shuffled.slice(0, Math.min(targetCount, availableQuestions.length));
            selectedQuestions.push(...selected);
        }

        // If we don't have enough questions, fill with random ones from available domains
        if (selectedQuestions.length < totalQuestions) {
            const remaining = totalQuestions - selectedQuestions.length;
            const allAvailable = Object.values(questionsByDomain).flat();
            const usedIds = new Set(selectedQuestions.map(q => q.id));
            const unusedQuestions = allAvailable.filter(q => !usedIds.has(q.id));
            const shuffled = this.shuffleArray(unusedQuestions);
            selectedQuestions.push(...shuffled.slice(0, remaining));
        }

        return selectedQuestions.slice(0, totalQuestions);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getAllQuestions() {
        if (!this.currentTest) return [];
        return [...this.currentTest.readingWriting, ...this.currentTest.math];
    }

    getCurrentQuestion() {
        const allQuestions = this.getAllQuestions();
        return allQuestions[this.currentQuestionIndex] || null;
    }

    getCurrentSection() {
        if (this.currentQuestionIndex < this.currentTest.readingWriting.length) {
            return 'Reading and Writing';
        }
        return 'Math';
    }

    saveAnswer(questionId, answer) {
        this.userAnswers[questionId] = answer;
    }

    getAnswer(questionId) {
        return this.userAnswers[questionId] || null;
    }

    nextQuestion() {
        const allQuestions = this.getAllQuestions();
        if (this.currentQuestionIndex < allQuestions.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }

    goToQuestion(index) {
        const allQuestions = this.getAllQuestions();
        if (index >= 0 && index < allQuestions.length) {
            this.currentQuestionIndex = index;
            return true;
        }
        return false;
    }

    calculateScore() {
        const allQuestions = this.getAllQuestions();
        let correct = 0;
        let total = allQuestions.length;

        for (const question of allQuestions) {
            const userAnswer = this.userAnswers[question.id];
            const correctAnswer = this.getCorrectAnswer(question);
            
            if (userAnswer && correctAnswer && 
                userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
                correct++;
            }
        }

        // Calculate section scores
        const rwQuestions = this.currentTest.readingWriting;
        const mathQuestions = this.currentTest.math;
        
        let rwCorrect = 0;
        let mathCorrect = 0;

        for (const question of rwQuestions) {
            const userAnswer = this.userAnswers[question.id];
            const correctAnswer = this.getCorrectAnswer(question);
            if (userAnswer && correctAnswer && 
                userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
                rwCorrect++;
            }
        }

        for (const question of mathQuestions) {
            const userAnswer = this.userAnswers[question.id];
            const correctAnswer = this.getCorrectAnswer(question);
            if (userAnswer && correctAnswer && 
                userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
                mathCorrect++;
            }
        }

        return {
            total: correct,
            totalQuestions: total,
            percentage: Math.round((correct / total) * 100),
            readingWriting: {
                correct: rwCorrect,
                total: rwQuestions.length,
                percentage: Math.round((rwCorrect / rwQuestions.length) * 100)
            },
            math: {
                correct: mathCorrect,
                total: mathQuestions.length,
                percentage: Math.round((mathCorrect / mathQuestions.length) * 100)
            }
        };
    }

    getCorrectAnswer(question) {
        // Try different structures for correct answer
        if (question.question && question.question.correct_answer) {
            return question.question.correct_answer;
        }
        if (question.content && question.content.correct_choice) {
            return question.content.correct_choice;
        }
        return null;
    }

    getQuestionText(question) {
        if (question.question && question.question.question) {
            return question.question.question;
        }
        if (question.content && question.content.stem) {
            return question.content.stem;
        }
        return 'Question text not available';
    }

    getChoices(question) {
        if (question.question && question.question.choices) {
            return question.question.choices;
        }
        if (question.content && question.content.options) {
            return question.content.options;
        }
        return null;
    }

    isGridIn(question) {
        const choices = this.getChoices(question);
        return !choices || Object.keys(choices).length === 0;
    }

    reset() {
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
    }
}

// UI Controller
class SATTestUI {
    constructor(generator) {
        this.generator = generator;
        this.currentView = 'start';
    }

    init() {
        this.bindEvents();
        this.showView('start');
    }

    bindEvents() {
        const startBtn = document.getElementById('start-test-btn');
        if (startBtn) startBtn.addEventListener('click', () => this.startTest());
        
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.addEventListener('click', () => this.handleNext());
        
        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.handlePrevious());
        
        const submitBtn = document.getElementById('submit-test-btn');
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitTest());
        
        const newTestBtn = document.getElementById('new-test-btn');
        if (newTestBtn) newTestBtn.addEventListener('click', () => this.startNewTest());
    }

    async startTest() {
        this.showLoading();
        
        const loaded = await this.generator.loadQuestions();
        if (!loaded) {
            alert('Failed to load questions. Please try again.');
            this.showView('start');
            return;
        }

        this.generator.generateTest();
        this.showView('test');
        this.renderQuestion();
    }

    showView(viewName) {
        this.currentView = viewName;
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        const viewElement = document.getElementById(`${viewName}-view`);
        if (viewElement) {
            viewElement.style.display = 'block';
        }
    }

    showLoading() {
        this.showView('loading');
    }

    renderQuestion() {
        const question = this.generator.getCurrentQuestion();
        if (!question) return;

        const allQuestions = this.generator.getAllQuestions();
        const questionNum = this.generator.currentQuestionIndex + 1;
        const totalQuestions = allQuestions.length;

        // Update progress
        document.getElementById('question-number').textContent = questionNum;
        document.getElementById('total-questions').textContent = totalQuestions;
        document.getElementById('section-name').textContent = this.generator.getCurrentSection();
        document.getElementById('domain-name').textContent = question.domain;

        // Update progress bar
        const progress = (questionNum / totalQuestions) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;

        // Render question text
        const questionText = this.generator.getQuestionText(question);
        document.getElementById('question-text').innerHTML = this.formatQuestionText(questionText);

        // Render answer options
        this.renderAnswerOptions(question);

        // Update navigation buttons
        document.getElementById('prev-btn').disabled = this.generator.currentQuestionIndex === 0;
        
        const isLastQuestion = this.generator.currentQuestionIndex === allQuestions.length - 1;
        document.getElementById('next-btn').style.display = isLastQuestion ? 'none' : 'block';
        document.getElementById('submit-test-btn').style.display = isLastQuestion ? 'block' : 'none';
    }

    formatQuestionText(text) {
        // Basic HTML sanitization - in production, use a proper sanitizer
        return text;
    }

    renderAnswerOptions(question) {
        const container = document.getElementById('answer-options');
        container.innerHTML = '';

        const choices = this.generator.getChoices(question);
        const savedAnswer = this.generator.getAnswer(question.id);

        if (this.generator.isGridIn(question)) {
            // Grid-in question (Student-Produced Response)
            container.innerHTML = `
                <div class="grid-in-container">
                    <label class="text-white mb-2 block">Enter your answer:</label>
                    <input type="text" id="grid-in-input" 
                           class="w-full px-4 py-3 rounded-lg bg-white/10 text-white border-2 border-white/20 focus:border-blue-400 focus:outline-none"
                           placeholder="Type your answer here"
                           value="${savedAnswer || ''}" />
                    <p class="text-white/60 text-sm mt-2">Enter your answer as a number or fraction</p>
                </div>
            `;

            const gridInInput = document.getElementById('grid-in-input');
            if (gridInInput) {
                gridInInput.addEventListener('input', (e) => {
                    this.generator.saveAnswer(question.id, e.target.value);
                });
            }
        } else {
            // Multiple choice question
            const choiceLetters = Object.keys(choices).sort();
            choiceLetters.forEach(letter => {
                const choiceText = choices[letter];
                const isSelected = savedAnswer === letter;

                const choiceEl = document.createElement('div');
                choiceEl.className = `choice-option ${isSelected ? 'selected' : ''}`;
                choiceEl.innerHTML = `
                    <div class="choice-letter">${letter.toUpperCase()}</div>
                    <div class="choice-text">${choiceText.body || choiceText}</div>
                `;
                choiceEl.addEventListener('click', () => {
                    document.querySelectorAll('.choice-option').forEach(el => el.classList.remove('selected'));
                    choiceEl.classList.add('selected');
                    this.generator.saveAnswer(question.id, letter);
                });

                container.appendChild(choiceEl);
            });
        }
    }

    handleNext() {
        this.generator.nextQuestion();
        this.renderQuestion();
        window.scrollTo(0, 0);
    }

    handlePrevious() {
        this.generator.previousQuestion();
        this.renderQuestion();
        window.scrollTo(0, 0);
    }

    submitTest() {
        const allQuestions = this.generator.getAllQuestions();
        const answeredCount = Object.keys(this.generator.userAnswers).length;
        const unanswered = allQuestions.length - answeredCount;

        if (unanswered > 0) {
            const confirm = window.confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`);
            if (!confirm) return;
        }

        this.showResults();
    }

    showResults() {
        const score = this.generator.calculateScore();
        
        this.showView('results');

        document.getElementById('total-score').textContent = score.percentage;
        document.getElementById('correct-count').textContent = score.total;
        document.getElementById('total-count').textContent = score.totalQuestions;

        document.getElementById('rw-score').textContent = score.readingWriting.percentage;
        document.getElementById('rw-correct').textContent = score.readingWriting.correct;
        document.getElementById('rw-total').textContent = score.readingWriting.total;

        document.getElementById('math-score').textContent = score.math.percentage;
        document.getElementById('math-correct').textContent = score.math.correct;
        document.getElementById('math-total').textContent = score.math.total;
    }

    startNewTest() {
        this.generator.reset();
        this.showView('start');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const generator = new SATTestGenerator();
    const ui = new SATTestUI(generator);
    ui.init();
});
