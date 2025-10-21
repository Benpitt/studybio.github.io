/**
 * Firebase Data Sync Utility
 * Syncs all localStorage data to Firestore
 * Add this to a new file: firebase-sync.js
 */

import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

class FirebaseSync {
    constructor(db, userId) {
        this.db = db;
        this.userId = userId;
    }

    /**
     * Sync user profile data
     */
    async syncUserProfile() {
        const userData = {
            userId: this.userId,
            userName: localStorage.getItem('userName'),
            userEmail: localStorage.getItem('userEmail'),
            streak: parseInt(localStorage.getItem('streak') || '0'),
            lastVisit: localStorage.getItem('lastVisit'),
            updatedAt: serverTimestamp()
        };

        await setDoc(doc(this.db, 'users', this.userId), userData, { merge: true });
        console.log('✅ User profile synced');
    }

    /**
     * Sync flashcard decks
     */
    async syncFlashcardDecks() {
        const decks = JSON.parse(localStorage.getItem('flashcardDecks') || '[]');
        
        for (const deck of decks) {
            const deckRef = doc(this.db, 'users', this.userId, 'flashcardDecks', deck.id.toString());
            await setDoc(deckRef, {
                ...deck,
                syncedAt: serverTimestamp()
            });
        }
        
        console.log(`✅ Synced ${decks.length} flashcard decks`);
    }

    /**
     * Sync flashcard progress
     */
    async syncFlashcardProgress() {
        const progress = JSON.parse(localStorage.getItem('flashcardProgress') || '{}');
        
        if (Object.keys(progress).length === 0) return;

        const progressRef = doc(this.db, 'users', this.userId, 'data', 'flashcardProgress');
        await setDoc(progressRef, {
            progress: progress,
            syncedAt: serverTimestamp()
        });
        
        console.log('✅ Flashcard progress synced');
    }

    /**
     * Sync quiz progress
     */
    async syncQuizProgress() {
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        
        if (Object.keys(progress).length === 0) return;

        const progressRef = doc(this.db, 'users', this.userId, 'data', 'quizProgress');
        await setDoc(progressRef, {
            progress: progress,
            syncedAt: serverTimestamp()
        });
        
        console.log('✅ Quiz progress synced');
    }

    /**
     * Sync assignments
     */
    async syncAssignments() {
        const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        
        for (const assignment of assignments) {
            const assignmentRef = doc(this.db, 'users', this.userId, 'assignments', assignment.id.toString());
            await setDoc(assignmentRef, {
                ...assignment,
                syncedAt: serverTimestamp()
            });
        }
        
        console.log(`✅ Synced ${assignments.length} assignments`);
    }

    /**
     * Sync BKT mastery scores
     */
    async syncBKTMastery() {
        const mastery = JSON.parse(localStorage.getItem('bkt_mastery_scores') || '{}');
        
        if (Object.keys(mastery).length === 0) return;

        const masteryRef = doc(this.db, 'users', this.userId, 'data', 'bktMastery');
        await setDoc(masteryRef, {
            scores: mastery,
            syncedAt: serverTimestamp()
        });
        
        console.log('✅ BKT mastery scores synced');
    }

    /**
     * Sync ALL data at once
     */
    async syncAll() {
        console.log('🔄 Starting full sync...');
        
        try {
            await this.syncUserProfile();
            await this.syncFlashcardDecks();
            await this.syncFlashcardProgress();
            await this.syncQuizProgress();
            await this.syncAssignments();
            await this.syncBKTMastery();
            
            // Mark last sync time
            localStorage.setItem('lastSync', new Date().toISOString());
            
            console.log('✅ Full sync complete!');
            return true;
        } catch (error) {
            console.error('❌ Sync failed:', error);
            return false;
        }
    }

    /**
     * Load data FROM Firebase TO localStorage
     */
    async loadFromFirebase() {
        console.log('📥 Loading data from Firebase...');
        
        try {
            // Load user profile
            const userDoc = await getDoc(doc(this.db, 'users', this.userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                localStorage.setItem('userName', data.userName || '');
                localStorage.setItem('userEmail', data.userEmail || '');
                localStorage.setItem('streak', data.streak?.toString() || '0');
                if (data.lastVisit) localStorage.setItem('lastVisit', data.lastVisit);
            }

            // Load flashcard decks
            const decksSnapshot = await getDocs(collection(this.db, 'users', this.userId, 'flashcardDecks'));
            const decks = [];
            decksSnapshot.forEach(doc => decks.push(doc.data()));
            if (decks.length > 0) {
                localStorage.setItem('flashcardDecks', JSON.stringify(decks));
            }

            // Load flashcard progress
            const flashProgressDoc = await getDoc(doc(this.db, 'users', this.userId, 'data', 'flashcardProgress'));
            if (flashProgressDoc.exists()) {
                localStorage.setItem('flashcardProgress', JSON.stringify(flashProgressDoc.data().progress));
            }

            // Load quiz progress
            const quizProgressDoc = await getDoc(doc(this.db, 'users', this.userId, 'data', 'quizProgress'));
            if (quizProgressDoc.exists()) {
                localStorage.setItem('progress', JSON.stringify(quizProgressDoc.data().progress));
            }

            // Load assignments
            const assignmentsSnapshot = await getDocs(collection(this.db, 'users', this.userId, 'assignments'));
            const assignments = [];
            assignmentsSnapshot.forEach(doc => assignments.push(doc.data()));
            if (assignments.length > 0) {
                localStorage.setItem('assignments', JSON.stringify(assignments));
            }

            // Load BKT mastery
            const masteryDoc = await getDoc(doc(this.db, 'users', this.userId, 'data', 'bktMastery'));
            if (masteryDoc.exists()) {
                localStorage.setItem('bkt_mastery_scores', JSON.stringify(masteryDoc.data().scores));
            }

            console.log('✅ Data loaded from Firebase');
            return true;
        } catch (error) {
            console.error('❌ Load failed:', error);
            return false;
        }
    }

    /**
     * Auto-sync on data changes
     */
    enableAutoSync(intervalMinutes = 5) {
        // Sync immediately
        this.syncAll();

        // Then sync every X minutes
        setInterval(() => {
            console.log('🔄 Auto-syncing...');
            this.syncAll();
        }, intervalMinutes * 60 * 1000);

        // Sync before page unload
        window.addEventListener('beforeunload', () => {
            this.syncAll();
        });

        console.log(`✅ Auto-sync enabled (every ${intervalMinutes} minutes)`);
    }
}

// Export for use
window.FirebaseSync = FirebaseSync;

/**
 * USAGE EXAMPLE:
 * 
 * // After Firebase is initialized:
 * const sync = new FirebaseSync(db, userId);
 * 
 * // One-time sync
 * await sync.syncAll();
 * 
 * // Load from cloud
 * await sync.loadFromFirebase();
 * 
 * // Enable auto-sync
 * sync.enableAutoSync(5); // sync every 5 minutes
 */
