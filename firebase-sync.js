/**
 * Firebase Data Sync Utility
 * Syncs all localStorage data to Firestore
 * Add this to a new file: firebase-sync.js
 */

import { getFirestore, doc, setDoc, getDoc, getDocs, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { debugLog, debugError } from './config.js';

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
        debugLog('✅ User profile synced');
    }

    /**
     * Sync flashcard decks (with compression and chunking for large decks)
     */
    async syncFlashcardDecks() {
        // Get decks from IndexedDB storage if available
        let decks;
        if (window.flashcardStorage) {
            decks = await window.flashcardStorage.getAllDecks();
        } else {
            decks = JSON.parse(localStorage.getItem('flashcardDecks') || '[]');
        }

        for (const deck of decks) {
            // Check if deck is too large for Firestore (1MB limit)
            let deckChunks = [deck];

            if (window.dataCompression) {
                const deckSize = window.dataCompression.getSize(deck);

                // If larger than 950KB, split into chunks
                if (deckSize > 950000) {
                    deckChunks = window.dataCompression.splitDeckForFirebase(deck);
                    debugLog(`📦 Split large deck "${deck.title}" into ${deckChunks.length} chunks`);
                }
            }

            // Save each chunk
            for (const chunk of deckChunks) {
                const chunkId = chunk.id || deck.id;
                const deckRef = doc(this.db, 'users', this.userId, 'flashcardDecks', chunkId.toString());
                await setDoc(deckRef, {
                    ...chunk,
                    syncedAt: serverTimestamp()
                });
            }
        }

        debugLog(`✅ Synced ${decks.length} flashcard decks`);
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
        
        debugLog('✅ Flashcard progress synced');
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
        
        debugLog('✅ Quiz progress synced');
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
        
        debugLog(`✅ Synced ${assignments.length} assignments`);
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
        
        debugLog('✅ BKT mastery scores synced');
    }

    /**
     * Sync ALL data at once
     */
    async syncAll() {
        debugLog('🔄 Starting full sync...');
        
        try {
            await this.syncUserProfile();
            await this.syncFlashcardDecks();
            await this.syncFlashcardProgress();
            await this.syncQuizProgress();
            await this.syncAssignments();
            await this.syncBKTMastery();
            
            // Mark last sync time
            localStorage.setItem('lastSync', new Date().toISOString());
            
            debugLog('✅ Full sync complete!');
            return true;
        } catch (error) {
            debugError('❌ Sync failed:', error);
            return false;
        }
    }

    /**
     * Load data FROM Firebase TO localStorage
     */
    async loadFromFirebase() {
        debugLog('📥 Loading data from Firebase...');
        
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
            const deckChunks = [];
            decksSnapshot.forEach(doc => deckChunks.push(doc.data()));

            if (deckChunks.length > 0) {
                // Group chunks by parentId
                const chunkGroups = {};
                const regularDecks = [];

                deckChunks.forEach(chunk => {
                    if (chunk.parentId) {
                        if (!chunkGroups[chunk.parentId]) {
                            chunkGroups[chunk.parentId] = [];
                        }
                        chunkGroups[chunk.parentId].push(chunk);
                    } else {
                        regularDecks.push(chunk);
                    }
                });

                // Combine chunked decks
                const decks = [...regularDecks];
                if (window.dataCompression) {
                    for (const parentId in chunkGroups) {
                        const combined = window.dataCompression.combineDeckChunks(chunkGroups[parentId]);
                        decks.push(combined);
                    }
                } else {
                    // If no compression utility, add chunks as-is
                    for (const parentId in chunkGroups) {
                        decks.push(...chunkGroups[parentId]);
                    }
                }

                // Save to IndexedDB or localStorage
                if (window.flashcardStorage) {
                    await window.flashcardStorage.saveAllDecks(decks);
                } else {
                    localStorage.setItem('flashcardDecks', JSON.stringify(decks));
                }

                debugLog(`✅ Loaded ${decks.length} flashcard decks from Firebase`);
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

            debugLog('✅ Data loaded from Firebase');
            return true;
        } catch (error) {
            debugError('❌ Load failed:', error);
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
            debugLog('🔄 Auto-syncing...');
            this.syncAll();
        }, intervalMinutes * 60 * 1000);

        // Sync before page unload
        window.addEventListener('beforeunload', () => {
            this.syncAll();
        });

        debugLog(`✅ Auto-sync enabled (every ${intervalMinutes} minutes)`);
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
