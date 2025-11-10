/**
 * Flashcard Storage Manager
 * Handles storage of flashcard decks using IndexedDB for large capacity
 * Falls back to localStorage for compatibility
 */

class FlashcardStorage {
    constructor() {
        this.dbName = 'FlashcardDB';
        this.dbVersion = 1;
        this.db = null;
        this.useIndexedDB = true;
        this.initialized = false;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        if (this.initialized) return true;

        // Check if IndexedDB is available
        if (!window.indexedDB) {
            console.warn('IndexedDB not available, falling back to localStorage');
            this.useIndexedDB = false;
            this.initialized = true;
            return true;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                this.useIndexedDB = false;
                this.initialized = true;
                resolve(true); // Resolve anyway, we'll use localStorage
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.initialized = true;
                console.log('✅ IndexedDB initialized for flashcard storage');

                // Migrate existing data from localStorage if needed
                this.migrateFromLocalStorage();

                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('decks')) {
                    db.createObjectStore('decks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('groups')) {
                    db.createObjectStore('groups', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Migrate data from localStorage to IndexedDB
     */
    async migrateFromLocalStorage() {
        try {
            // Check if we've already migrated
            const migrated = await this.getMetadata('migrated');
            if (migrated) return;

            const decksStr = localStorage.getItem('flashcardDecks');
            const groupsStr = localStorage.getItem('flashcardGroups');

            if (decksStr) {
                const decks = JSON.parse(decksStr);
                for (const deck of decks) {
                    await this.saveDeck(deck);
                }
                console.log(`✅ Migrated ${decks.length} decks to IndexedDB`);
            }

            if (groupsStr) {
                const groups = JSON.parse(groupsStr);
                for (const group of groups) {
                    await this.saveGroup(group);
                }
                console.log(`✅ Migrated ${groups.length} groups to IndexedDB`);
            }

            // Mark as migrated
            await this.saveMetadata('migrated', true);
        } catch (error) {
            console.error('Migration error:', error);
        }
    }

    /**
     * Save a single deck (with optional compression)
     */
    async saveDeck(deck) {
        await this.init();

        // Compress large decks if compression is available
        let deckToSave = deck;
        if (window.dataCompression && window.dataCompression.shouldCompress(deck)) {
            deckToSave = await window.dataCompression.compressDeck(deck);
        }

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['decks'], 'readwrite');
                const store = transaction.objectStore('decks');
                const request = store.put(deckToSave);

                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error('Failed to save deck to IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to localStorage (may fail for large decks)
            return this.saveToLocalStorage('flashcardDecks', deckToSave, true);
        }
    }

    /**
     * Get all decks (with automatic decompression)
     */
    async getAllDecks() {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise(async (resolve, reject) => {
                const transaction = this.db.transaction(['decks'], 'readonly');
                const store = transaction.objectStore('decks');
                const request = store.getAll();

                request.onsuccess = async () => {
                    const decks = request.result || [];

                    // Decompress decks if needed
                    if (window.dataCompression) {
                        const decompressed = [];
                        for (const deck of decks) {
                            if (deck._compressed) {
                                decompressed.push(await window.dataCompression.decompressDeck(deck));
                            } else {
                                decompressed.push(deck);
                            }
                        }
                        resolve(decompressed);
                    } else {
                        resolve(decks);
                    }
                };
                request.onerror = () => {
                    console.error('Failed to get decks from IndexedDB:', request.error);
                    resolve([]);
                };
            });
        } else {
            // Fallback to localStorage
            const decksStr = localStorage.getItem('flashcardDecks');
            return decksStr ? JSON.parse(decksStr) : [];
        }
    }

    /**
     * Delete a deck
     */
    async deleteDeck(deckId) {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['decks'], 'readwrite');
                const store = transaction.objectStore('decks');
                const request = store.delete(deckId);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } else {
            // Fallback to localStorage
            const decks = await this.getAllDecks();
            const filtered = decks.filter(d => d.id !== deckId);
            return this.saveAllDecks(filtered);
        }
    }

    /**
     * Save all decks at once
     */
    async saveAllDecks(decks) {
        await this.init();

        if (this.useIndexedDB && this.db) {
            // Clear existing and save all
            const transaction = this.db.transaction(['decks'], 'readwrite');
            const store = transaction.objectStore('decks');

            await new Promise((resolve) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = resolve;
            });

            for (const deck of decks) {
                await this.saveDeck(deck);
            }
            return true;
        } else {
            // Try localStorage
            try {
                localStorage.setItem('flashcardDecks', JSON.stringify(decks));
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    throw new Error('Storage quota exceeded. Your flashcard deck is too large. Please enable IndexedDB in your browser or reduce deck size.');
                }
                throw e;
            }
        }
    }

    /**
     * Save a group
     */
    async saveGroup(group) {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['groups'], 'readwrite');
                const store = transaction.objectStore('groups');
                const request = store.put(group);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } else {
            return this.saveToLocalStorage('flashcardGroups', group, true);
        }
    }

    /**
     * Get all groups
     */
    async getAllGroups() {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['groups'], 'readonly');
                const store = transaction.objectStore('groups');
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } else {
            const groupsStr = localStorage.getItem('flashcardGroups');
            return groupsStr ? JSON.parse(groupsStr) : [];
        }
    }

    /**
     * Save all groups
     */
    async saveAllGroups(groups) {
        await this.init();

        if (this.useIndexedDB && this.db) {
            const transaction = this.db.transaction(['groups'], 'readwrite');
            const store = transaction.objectStore('groups');

            await new Promise((resolve) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = resolve;
            });

            for (const group of groups) {
                await this.saveGroup(group);
            }
            return true;
        } else {
            try {
                localStorage.setItem('flashcardGroups', JSON.stringify(groups));
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    throw new Error('Storage quota exceeded. Try reducing your data size.');
                }
                throw e;
            }
        }
    }

    /**
     * Delete a group
     */
    async deleteGroup(groupId) {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['groups'], 'readwrite');
                const store = transaction.objectStore('groups');
                const request = store.delete(groupId);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } else {
            const groups = await this.getAllGroups();
            const filtered = groups.filter(g => g.id !== groupId);
            return this.saveAllGroups(filtered);
        }
    }

    /**
     * Save metadata
     */
    async saveMetadata(key, value) {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['metadata'], 'readwrite');
                const store = transaction.objectStore('metadata');
                const request = store.put({ key, value });

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }
        return true;
    }

    /**
     * Get metadata
     */
    async getMetadata(key) {
        await this.init();

        if (this.useIndexedDB && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['metadata'], 'readonly');
                const store = transaction.objectStore('metadata');
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result?.value);
                request.onerror = () => resolve(null);
            });
        }
        return null;
    }

    /**
     * Helper: Save to localStorage with array handling
     */
    saveToLocalStorage(storageKey, item, isArrayItem = false) {
        try {
            if (isArrayItem) {
                const existing = localStorage.getItem(storageKey);
                const array = existing ? JSON.parse(existing) : [];
                const index = array.findIndex(i => i.id === item.id);

                if (index >= 0) {
                    array[index] = item;
                } else {
                    array.push(item);
                }

                localStorage.setItem(storageKey, JSON.stringify(array));
            } else {
                localStorage.setItem(storageKey, JSON.stringify(item));
            }
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                throw new Error('Storage quota exceeded. Your data is too large for localStorage. Please enable IndexedDB support in your browser.');
            }
            throw e;
        }
    }

    /**
     * Get storage info
     */
    async getStorageInfo() {
        await this.init();

        return {
            type: this.useIndexedDB ? 'IndexedDB' : 'LocalStorage',
            decksCount: (await this.getAllDecks()).length,
            groupsCount: (await this.getAllGroups()).length
        };
    }
}

// Create global instance
window.flashcardStorage = new FlashcardStorage();
