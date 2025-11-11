/**
 * SAT Reinforcement Learning System
 *
 * Implements a contextual bandit algorithm inspired by VowpalWabbit for intelligent
 * question selection. Uses Thompson Sampling with IRT-based context to balance
 * exploration (trying different question types) and exploitation (focusing on weaknesses).
 *
 * Key features:
 * - Contextual bandit with IRT theta as context
 * - Thompson Sampling for exploration/exploitation
 * - Zone of Proximal Development (ZPD) targeting
 * - Adaptive difficulty adjustment
 * - Weakness-focused practice
 */

class SATReinforcementLearning {
  constructor(irtModel) {
    this.irtModel = irtModel;

    // Question selection strategy parameters
    this.strategies = {
      // Zone of Proximal Development: target questions slightly above current ability
      zpd: {
        enabled: true,
        lowerBound: -0.5,  // theta - 0.5
        upperBound: 1.0    // theta + 1.0
      },

      // Weakness focus: prioritize weak domains
      weaknessFocus: {
        enabled: true,
        weight: 0.7  // 70% weight to weak domains
      },

      // Exploration vs exploitation
      exploration: {
        epsilon: 0.15,  // 15% random exploration
        decayRate: 0.995 // Decay epsilon over time
      },

      // Thompson Sampling parameters (Beta distribution)
      thompsonSampling: {
        alpha: 1,  // Prior successes
        beta: 1    // Prior failures
      }
    };

    // Track arm performance (each domain is an "arm")
    this.armStats = {};
    this.initializeArms();

    // Question history for adaptive learning
    this.questionHistory = [];
    this.maxHistorySize = 100;

    this.loadFromStorage();
  }

  /**
   * Initialize arms (domains) for multi-armed bandit
   */
  initializeArms() {
    const domains = Object.keys(this.irtModel.domains);
    for (const domain of domains) {
      this.armStats[domain] = {
        pulls: 0,
        rewards: 0,
        alpha: this.strategies.thompsonSampling.alpha,  // Beta distribution param
        beta: this.strategies.thompsonSampling.beta,    // Beta distribution param
        avgReward: 0
      };
    }
  }

  /**
   * Sample from Beta distribution (for Thompson Sampling)
   * Uses approximation for browser compatibility
   */
  betaSample(alpha, beta) {
    // Gamma approximation for Beta sampling
    const gammaA = this.gammaSample(alpha, 1);
    const gammaB = this.gammaSample(beta, 1);
    return gammaA / (gammaA + gammaB);
  }

  /**
   * Sample from Gamma distribution
   * Using Marsaglia and Tsang's method
   */
  gammaSample(shape, scale) {
    if (shape < 1) {
      return this.gammaSample(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x, v;
      do {
        x = this.normalSample(0, 1);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();
      const xSquared = x * x;

      if (u < 1 - 0.0331 * xSquared * xSquared) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * xSquared + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Sample from normal distribution (Box-Muller transform)
   */
  normalSample(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z;
  }

  /**
   * Select optimal domain to practice using Thompson Sampling
   * @returns {string} Selected domain
   */
  selectDomain() {
    // Epsilon-greedy exploration
    if (Math.random() < this.strategies.exploration.epsilon) {
      // Random exploration
      const domains = Object.keys(this.armStats);
      return domains[Math.floor(Math.random() * domains.length)];
    }

    // Thompson Sampling: sample from each arm's posterior distribution
    const samples = {};
    for (const [domain, stats] of Object.entries(this.armStats)) {
      // Sample expected reward from Beta distribution
      samples[domain] = this.betaSample(stats.alpha, stats.beta);

      // Apply weakness focus: boost domains with low theta
      if (this.strategies.weaknessFocus.enabled) {
        const theta = this.irtModel.getAbility(domain);
        const weaknessBoost = 1 - (theta + 3) / 6; // Map [-3, 3] to [1, 0]
        samples[domain] += this.strategies.weaknessFocus.weight * weaknessBoost;
      }
    }

    // Select domain with highest sample value
    return Object.entries(samples).reduce((best, [domain, value]) =>
      value > best.value ? { domain, value } : best,
      { domain: null, value: -Infinity }
    ).domain;
  }

  /**
   * Select optimal difficulty for a given domain and current ability
   * Uses Zone of Proximal Development (ZPD)
   * @param {string} domain - The skill domain
   * @returns {string} Difficulty level (E, M, H)
   */
  selectDifficulty(domain) {
    const theta = this.irtModel.getAbility(domain);

    if (!this.strategies.zpd.enabled) {
      // Random difficulty if ZPD disabled
      const difficulties = ['E', 'M', 'H'];
      return difficulties[Math.floor(Math.random() * difficulties.length)];
    }

    // Calculate optimal difficulty based on ZPD
    const targetDifficulty = theta + 0.5; // Slightly above current ability

    // Map target difficulty to discrete levels
    if (targetDifficulty < -0.5) return 'E';
    if (targetDifficulty < 0.75) return 'M';
    return 'H';
  }

  /**
   * Filter questions based on selected domain and optimal difficulty
   * @param {Array} questions - All available questions
   * @param {string} domain - Target domain
   * @param {string} difficulty - Target difficulty
   * @returns {Array} Filtered questions
   */
  filterQuestions(questions, domain, difficulty) {
    return questions.filter(q => {
      const qDomain = q.primary_class_cd_desc || q.domain;
      const qDifficulty = q.difficulty;

      return qDomain === domain && qDifficulty === difficulty;
    });
  }

  /**
   * Recommend next question set based on current abilities
   * @param {Array} allQuestions - All available questions
   * @param {number} count - Number of questions to recommend
   * @returns {Object} {questions, reasoning}
   */
  recommendQuestions(allQuestions, count = 10) {
    const recommendations = [];
    const reasoning = [];

    // Identify weak domains
    const weaknesses = this.irtModel.identifyWeaknesses(3);

    // Select domains and difficulties
    for (let i = 0; i < count; i++) {
      // Select domain using Thompson Sampling
      const domain = this.selectDomain();
      const difficulty = this.selectDifficulty(domain);
      const theta = this.irtModel.getAbility(domain);

      // Filter available questions
      const candidates = this.filterQuestions(allQuestions, domain, difficulty);

      if (candidates.length > 0) {
        // Random selection from candidates (avoid repeats)
        const usedIds = recommendations.map(r => r.questionId);
        const available = candidates.filter(q => !usedIds.includes(q.questionId));

        if (available.length > 0) {
          const question = available[Math.floor(Math.random() * available.length)];
          recommendations.push(question);

          reasoning.push({
            questionId: question.questionId,
            domain,
            difficulty,
            theta: theta.toFixed(2),
            reason: `Target domain: ${domain} (θ=${theta.toFixed(2)}), Difficulty: ${difficulty}`
          });
        }
      }
    }

    // Decay exploration rate
    this.strategies.exploration.epsilon *= this.strategies.exploration.decayRate;

    return {
      questions: recommendations,
      reasoning,
      weaknesses: weaknesses.map(w => ({
        domain: w.domain,
        theta: w.theta.toFixed(2),
        level: w.stats.level
      }))
    };
  }

  /**
   * Update model after a question is answered
   * @param {string} domain - Question domain
   * @param {boolean} correct - Whether answer was correct
   * @param {string} difficulty - Question difficulty
   * @param {number} responseTime - Time taken in seconds
   */
  updateModel(domain, correct, difficulty, responseTime) {
    if (!this.armStats[domain]) {
      console.warn(`Unknown domain: ${domain}`);
      return;
    }

    // Update IRT model
    this.irtModel.updateAbility(domain, correct, difficulty);

    // Calculate reward (correct + speed bonus)
    const speedBonus = Math.max(0, 1 - responseTime / 120); // Bonus for < 2 min
    const reward = correct ? (0.7 + 0.3 * speedBonus) : 0;

    // Update arm statistics (Thompson Sampling)
    this.armStats[domain].pulls++;
    this.armStats[domain].rewards += reward;
    this.armStats[domain].avgReward = this.armStats[domain].rewards / this.armStats[domain].pulls;

    // Update Beta distribution parameters
    if (correct) {
      this.armStats[domain].alpha += 1;
    } else {
      this.armStats[domain].beta += 1;
    }

    // Add to history
    this.questionHistory.push({
      domain,
      correct,
      difficulty,
      responseTime,
      reward,
      timestamp: Date.now()
    });

    // Trim history
    if (this.questionHistory.length > this.maxHistorySize) {
      this.questionHistory.shift();
    }

    this.saveToStorage();
  }

  /**
   * Get learning insights and recommendations
   */
  getInsights() {
    const weaknesses = this.irtModel.identifyWeaknesses(3);
    const strengths = this.irtModel.identifyStrengths(3);

    // Calculate recent performance trend
    const recentQuestions = this.questionHistory.slice(-10);
    const recentAccuracy = recentQuestions.length > 0
      ? recentQuestions.filter(q => q.correct).length / recentQuestions.length
      : 0;

    // Calculate average response time
    const avgResponseTime = recentQuestions.length > 0
      ? recentQuestions.reduce((sum, q) => sum + q.responseTime, 0) / recentQuestions.length
      : 0;

    // Domain-specific insights
    const domainInsights = {};
    for (const [domain, stats] of Object.entries(this.armStats)) {
      const irtStats = this.irtModel.getDomainStats(domain);
      if (irtStats && irtStats.attempts > 0) {
        domainInsights[domain] = {
          theta: irtStats.theta,
          accuracy: irtStats.accuracy,
          attempts: irtStats.attempts,
          avgReward: stats.avgReward,
          level: irtStats.level,
          percentile: irtStats.percentile
        };
      }
    }

    return {
      weaknesses,
      strengths,
      recentAccuracy: (recentAccuracy * 100).toFixed(1),
      avgResponseTime: avgResponseTime.toFixed(1),
      domainInsights,
      totalQuestions: this.questionHistory.length,
      explorationRate: (this.strategies.exploration.epsilon * 100).toFixed(1)
    };
  }

  /**
   * Save state to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('sat_rl_arms', JSON.stringify(this.armStats));
      localStorage.setItem('sat_rl_history', JSON.stringify(this.questionHistory));
      localStorage.setItem('sat_rl_epsilon', this.strategies.exploration.epsilon.toString());
    } catch (e) {
      console.error('Failed to save RL model:', e);
    }
  }

  /**
   * Load state from localStorage
   */
  loadFromStorage() {
    try {
      const arms = localStorage.getItem('sat_rl_arms');
      if (arms) {
        this.armStats = JSON.parse(arms);
      }

      const history = localStorage.getItem('sat_rl_history');
      if (history) {
        this.questionHistory = JSON.parse(history);
      }

      const epsilon = localStorage.getItem('sat_rl_epsilon');
      if (epsilon) {
        this.strategies.exploration.epsilon = parseFloat(epsilon);
      }
    } catch (e) {
      console.error('Failed to load RL model:', e);
    }
  }

  /**
   * Reset all data
   */
  reset() {
    this.initializeArms();
    this.questionHistory = [];
    this.strategies.exploration.epsilon = 0.15;
    this.saveToStorage();
  }

  /**
   * Export data for analysis
   */
  exportData() {
    return {
      armStats: this.armStats,
      questionHistory: this.questionHistory,
      epsilon: this.strategies.exploration.epsilon,
      insights: this.getInsights(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create global instance (will be initialized with IRT model)
let satRLModel = null;

// Initialize function to be called after IRT model is loaded
function initializeSATRL() {
  if (typeof satIRTModel !== 'undefined') {
    satRLModel = new SATReinforcementLearning(satIRTModel);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SATReinforcementLearning;
}
