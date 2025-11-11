/**
 * SAT Multidimensional Item Response Theory (IRT) Model
 *
 * Implements a 2-Parameter Logistic (2PL) IRT model with multidimensional abilities.
 * Tracks student ability (theta) across multiple SAT domains:
 * - Math: Algebra, Advanced Math, Problem-Solving, Geometry & Trig
 * - Reading & Writing: Craft & Structure, Information & Ideas, Expression of Ideas, Standard English Conventions
 *
 * Key concepts:
 * - θ (theta): Student ability parameter for each domain (-3 to +3, mean 0)
 * - a (discrimination): How well an item differentiates between students
 * - b (difficulty): The ability level at which P(correct) = 0.5
 * - P(θ): Probability of correct response given ability
 */

class SATIRTModel {
  constructor() {
    // Initialize default parameters
    this.domains = {
      // Math domains
      'Algebra': { theta: 0, attempts: 0, correct: 0 },
      'Advanced Math': { theta: 0, attempts: 0, correct: 0 },
      'Problem-Solving and Data Analysis': { theta: 0, attempts: 0, correct: 0 },
      'Geometry and Trigonometry': { theta: 0, attempts: 0, correct: 0 },

      // Reading & Writing domains
      'Craft and Structure': { theta: 0, attempts: 0, correct: 0 },
      'Information and Ideas': { theta: 0, attempts: 0, correct: 0 },
      'Expression of Ideas': { theta: 0, attempts: 0, correct: 0 },
      'Standard English Conventions': { theta: 0, attempts: 0, correct: 0 }
    };

    // IRT parameters
    this.defaultDiscrimination = 1.0;  // a parameter
    this.learningRate = 0.3;           // How quickly theta updates

    // Difficulty mapping (SAT uses E, M, H)
    this.difficultyMap = {
      'E': -1.0,  // Easy questions have low difficulty (b = -1)
      'M': 0.0,   // Medium questions are average (b = 0)
      'H': 1.5    // Hard questions have high difficulty (b = 1.5)
    };

    this.loadFromStorage();
  }

  /**
   * 2PL IRT Model: P(correct | θ, a, b) = 1 / (1 + exp(-a(θ - b)))
   * @param {number} theta - Student ability
   * @param {number} discrimination - Item discrimination (a)
   * @param {number} difficulty - Item difficulty (b)
   * @returns {number} Probability of correct response (0-1)
   */
  probabilityCorrect(theta, discrimination, difficulty) {
    const exponent = -discrimination * (theta - difficulty);
    return 1 / (1 + Math.exp(exponent));
  }

  /**
   * Update student ability after answering a question
   * Uses Maximum A Posteriori (MAP) estimation with gradient ascent
   * @param {string} domain - The skill domain
   * @param {boolean} correct - Whether the answer was correct
   * @param {string} difficulty - Question difficulty (E, M, H)
   * @param {number} discrimination - Item discrimination parameter
   */
  updateAbility(domain, correct, difficulty, discrimination = this.defaultDiscrimination) {
    if (!this.domains[domain]) {
      console.warn(`Unknown domain: ${domain}`);
      return;
    }

    const b = this.difficultyMap[difficulty] || 0;
    const currentTheta = this.domains[domain].theta;

    // Calculate probability with current theta
    const p = this.probabilityCorrect(currentTheta, discrimination, b);

    // Calculate gradient: ∂L/∂θ = a * (correct - P(θ))
    const gradient = discrimination * ((correct ? 1 : 0) - p);

    // Update theta using gradient ascent with learning rate
    const newTheta = currentTheta + this.learningRate * gradient;

    // Bound theta to reasonable range [-3, 3]
    this.domains[domain].theta = Math.max(-3, Math.min(3, newTheta));
    this.domains[domain].attempts++;
    if (correct) {
      this.domains[domain].correct++;
    }

    this.saveToStorage();
  }

  /**
   * Get the current ability estimate for a domain
   * @param {string} domain - The skill domain
   * @returns {number} Theta value (-3 to 3)
   */
  getAbility(domain) {
    return this.domains[domain]?.theta || 0;
  }

  /**
   * Get all domain abilities
   * @returns {Object} Map of domain -> theta
   */
  getAllAbilities() {
    const abilities = {};
    for (const [domain, data] of Object.entries(this.domains)) {
      abilities[domain] = data.theta;
    }
    return abilities;
  }

  /**
   * Get comprehensive statistics for a domain
   * @param {string} domain
   * @returns {Object} Stats including theta, accuracy, attempts, etc.
   */
  getDomainStats(domain) {
    const data = this.domains[domain];
    if (!data) return null;

    return {
      theta: data.theta,
      attempts: data.attempts,
      correct: data.correct,
      accuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0,
      percentile: this.thetaToPercentile(data.theta),
      level: this.thetaToLevel(data.theta)
    };
  }

  /**
   * Convert theta to percentile (approximate)
   * Assumes theta ~ N(0, 1)
   */
  thetaToPercentile(theta) {
    // Using cumulative distribution function approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(theta));
    const d = 0.3989423 * Math.exp(-theta * theta / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    const percentile = theta > 0 ? 1 - p : p;
    return Math.round(percentile * 100);
  }

  /**
   * Convert theta to proficiency level
   */
  thetaToLevel(theta) {
    if (theta >= 2.0) return 'Advanced';
    if (theta >= 1.0) return 'Proficient';
    if (theta >= 0) return 'Developing';
    if (theta >= -1.0) return 'Basic';
    return 'Below Basic';
  }

  /**
   * Identify weakest domains (lowest theta values)
   * @param {number} count - Number of weak domains to return
   * @returns {Array} Array of {domain, theta, stats}
   */
  identifyWeaknesses(count = 3) {
    const domainStats = Object.entries(this.domains)
      .filter(([_, data]) => data.attempts > 0) // Only domains with attempts
      .map(([domain, data]) => ({
        domain,
        theta: data.theta,
        stats: this.getDomainStats(domain)
      }))
      .sort((a, b) => a.theta - b.theta); // Sort by theta ascending

    return domainStats.slice(0, count);
  }

  /**
   * Identify strongest domains (highest theta values)
   * @param {number} count - Number of strong domains to return
   * @returns {Array} Array of {domain, theta, stats}
   */
  identifyStrengths(count = 3) {
    const domainStats = Object.entries(this.domains)
      .filter(([_, data]) => data.attempts > 0)
      .map(([domain, data]) => ({
        domain,
        theta: data.theta,
        stats: this.getDomainStats(domain)
      }))
      .sort((a, b) => b.theta - a.theta); // Sort by theta descending

    return domainStats.slice(0, count);
  }

  /**
   * Get expected score on SAT section (200-800 scale)
   * @param {string} module - 'math' or 'english'
   * @returns {number} Estimated SAT score
   */
  getEstimatedSATScore(module) {
    let relevantDomains;

    if (module === 'math') {
      relevantDomains = ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'];
    } else if (module === 'english') {
      relevantDomains = ['Craft and Structure', 'Information and Ideas', 'Expression of Ideas', 'Standard English Conventions'];
    } else {
      return null;
    }

    // Calculate average theta across domains
    let totalTheta = 0;
    let domainsWithData = 0;

    for (const domain of relevantDomains) {
      if (this.domains[domain]?.attempts > 0) {
        totalTheta += this.domains[domain].theta;
        domainsWithData++;
      }
    }

    if (domainsWithData === 0) return null;

    const avgTheta = totalTheta / domainsWithData;

    // Convert theta to SAT score (200-800)
    // theta = 0 -> 500 (average)
    // theta = 3 -> 800
    // theta = -3 -> 200
    const score = 500 + (avgTheta * 100);
    return Math.round(Math.max(200, Math.min(800, score)));
  }

  /**
   * Save model to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('sat_irt_model', JSON.stringify(this.domains));
      localStorage.setItem('sat_irt_updated', new Date().toISOString());
    } catch (e) {
      console.error('Failed to save IRT model:', e);
    }
  }

  /**
   * Load model from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('sat_irt_model');
      if (stored) {
        const loaded = JSON.parse(stored);
        // Merge with defaults to handle new domains
        for (const [domain, data] of Object.entries(loaded)) {
          if (this.domains[domain]) {
            this.domains[domain] = data;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load IRT model:', e);
    }
  }

  /**
   * Reset all data (for testing or new user)
   */
  reset() {
    for (const domain in this.domains) {
      this.domains[domain] = { theta: 0, attempts: 0, correct: 0 };
    }
    this.saveToStorage();
  }

  /**
   * Export model data for analysis
   */
  exportData() {
    return {
      domains: this.domains,
      timestamp: new Date().toISOString(),
      summary: {
        totalAttempts: Object.values(this.domains).reduce((sum, d) => sum + d.attempts, 0),
        totalCorrect: Object.values(this.domains).reduce((sum, d) => sum + d.correct, 0),
        avgTheta: Object.values(this.domains).reduce((sum, d) => sum + d.theta, 0) / Object.keys(this.domains).length
      }
    };
  }
}

// Global singleton instance
const satIRTModel = new SATIRTModel();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SATIRTModel;
}
