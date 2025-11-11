/**
 * SAT Firebase Sync Module
 *
 * Handles synchronization of SAT IRT and RL data to Firebase Firestore
 * Similar to BKT sync but for SAT-specific data structures
 */

class SATFirebaseSync {
  constructor(db, auth) {
    this.db = db;
    this.auth = auth;
    this.userId = null;

    // Listen for auth state changes
    if (auth) {
      auth.onAuthStateChanged((user) => {
        if (user) {
          this.userId = user.uid;
          console.log('SAT Firebase Sync initialized for user:', user.uid);
        } else {
          this.userId = null;
          console.log('SAT Firebase Sync: No user logged in');
        }
      });
    }
  }

  /**
   * Save a review record to Firebase (similar to BKT reviews)
   * @param {Object} reviewData - Review data to save
   */
  async saveReview(reviewData) {
    if (!this.userId || !this.db) {
      console.warn('Cannot save review: No user or database connection');
      return false;
    }

    try {
      const review = {
        userId: this.userId,
        domain: reviewData.domain,
        correct: reviewData.correct ? 1 : 0,
        difficulty: reviewData.difficulty,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        questionId: reviewData.questionId,
        responseTime: reviewData.responseTime,
        module: reviewData.module || 'unknown',
        theta: reviewData.theta || 0,
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      };

      await this.db.collection('sat_reviews').add(review);
      console.log('✅ SAT review saved to Firebase');
      return true;
    } catch (error) {
      console.error('Error saving SAT review:', error);
      return false;
    }
  }

  /**
   * Save IRT model data to Firebase
   */
  async saveIRTModel() {
    if (!this.userId || !this.db || typeof satIRTModel === 'undefined') {
      console.warn('Cannot save IRT model: Missing requirements');
      return false;
    }

    try {
      const modelData = satIRTModel.exportData();

      await this.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .doc('satIRTModel')
        .set({
          domains: modelData.domains,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          summary: modelData.summary
        });

      console.log('✅ IRT model saved to Firebase');
      return true;
    } catch (error) {
      console.error('Error saving IRT model:', error);
      return false;
    }
  }

  /**
   * Save RL model data to Firebase
   */
  async saveRLModel() {
    if (!this.userId || !this.db || typeof satRLModel === 'undefined' || !satRLModel) {
      console.warn('Cannot save RL model: Missing requirements');
      return false;
    }

    try {
      const modelData = satRLModel.exportData();

      await this.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .doc('satRLModel')
        .set({
          armStats: modelData.armStats,
          epsilon: modelData.epsilon,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          questionHistoryCount: modelData.questionHistory.length
        });

      console.log('✅ RL model saved to Firebase');
      return true;
    } catch (error) {
      console.error('Error saving RL model:', error);
      return false;
    }
  }

  /**
   * Load IRT model from Firebase
   */
  async loadIRTModel() {
    if (!this.userId || !this.db || typeof satIRTModel === 'undefined') {
      console.warn('Cannot load IRT model: Missing requirements');
      return false;
    }

    try {
      const doc = await this.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .doc('satIRTModel')
        .get();

      if (doc.exists) {
        const data = doc.data();
        // Restore domains data
        for (const [domain, domainData] of Object.entries(data.domains)) {
          if (satIRTModel.domains[domain]) {
            satIRTModel.domains[domain] = domainData;
          }
        }
        satIRTModel.saveToStorage();
        console.log('✅ IRT model loaded from Firebase');
        return true;
      } else {
        console.log('No IRT model found in Firebase');
        return false;
      }
    } catch (error) {
      console.error('Error loading IRT model:', error);
      return false;
    }
  }

  /**
   * Load RL model from Firebase
   */
  async loadRLModel() {
    if (!this.userId || !this.db || typeof satRLModel === 'undefined' || !satRLModel) {
      console.warn('Cannot load RL model: Missing requirements');
      return false;
    }

    try {
      const doc = await this.db
        .collection('users')
        .doc(this.userId)
        .collection('data')
        .doc('satRLModel')
        .get();

      if (doc.exists) {
        const data = doc.data();
        // Restore arm stats
        satRLModel.armStats = data.armStats;
        satRLModel.strategies.exploration.epsilon = data.epsilon;
        satRLModel.saveToStorage();
        console.log('✅ RL model loaded from Firebase');
        return true;
      } else {
        console.log('No RL model found in Firebase');
        return false;
      }
    } catch (error) {
      console.error('Error loading RL model:', error);
      return false;
    }
  }

  /**
   * Sync all SAT data to Firebase
   */
  async syncAll() {
    if (!this.userId) {
      console.warn('Cannot sync: No user logged in');
      return false;
    }

    console.log('🔄 Starting SAT data sync...');

    const results = await Promise.all([
      this.saveIRTModel(),
      this.saveRLModel()
    ]);

    const success = results.every(r => r === true);
    if (success) {
      console.log('✅ All SAT data synced successfully');
    } else {
      console.warn('⚠️ Some SAT data failed to sync');
    }

    return success;
  }

  /**
   * Load all SAT data from Firebase
   */
  async loadAll() {
    if (!this.userId) {
      console.warn('Cannot load: No user logged in');
      return false;
    }

    console.log('📥 Loading SAT data from Firebase...');

    const results = await Promise.all([
      this.loadIRTModel(),
      this.loadRLModel()
    ]);

    const success = results.some(r => r === true);
    if (success) {
      console.log('✅ SAT data loaded from Firebase');
    } else {
      console.log('ℹ️ No SAT data found in Firebase, using local data');
    }

    return success;
  }

  /**
   * Enable auto-sync at specified interval
   * @param {number} intervalMinutes - Sync interval in minutes
   */
  enableAutoSync(intervalMinutes = 5) {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.autoSyncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 Auto-sync enabled (every ${intervalMinutes} minutes)`);

    // Also sync on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncAll();
      }
    });
  }

  /**
   * Disable auto-sync
   */
  disableAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('🔄 Auto-sync disabled');
    }
  }
}

// Create global instance (will be initialized when Firebase is ready)
let satFirebaseSync = null;

// Initialize function
function initializeSATFirebaseSync(db, auth) {
  satFirebaseSync = new SATFirebaseSync(db, auth);
  return satFirebaseSync;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SATFirebaseSync, initializeSATFirebaseSync };
}
