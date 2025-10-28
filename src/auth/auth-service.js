/**
 * Authentication Service with Secure Caching
 * Handles Firebase authentication with token persistence and refresh
 */

import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

class AuthService {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.sessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    /**
     * Initialize Firebase Auth with persistence
     */
    async initializeAuth(firebaseApp) {
        this.auth = getAuth(firebaseApp);

        // Set persistence to LOCAL (survives browser restarts)
        // This uses IndexedDB with fallback to localStorage
        try {
            await setPersistence(this.auth, browserLocalPersistence);
            console.log('Firebase persistence enabled');
        } catch (error) {
            console.error('Failed to set persistence:', error);
        }

        return this.auth;
    }

    /**
     * Set up auth state listener
     * This automatically handles token refresh
     */
    onAuthStateChange(callback) {
        if (!this.auth) {
            console.error('Auth not initialized');
            return;
        }

        return onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                // User is signed in and token is valid
                this.currentUser = user;

                // Update cached user data
                await this.updateUserCache(user);

                // Force token refresh if needed
                try {
                    const token = await user.getIdToken(false); // false = use cached token
                    const tokenResult = await user.getIdTokenResult();

                    // Check if token is expiring soon (within 5 minutes)
                    const expirationTime = new Date(tokenResult.expirationTime).getTime();
                    const now = Date.now();
                    const fiveMinutes = 5 * 60 * 1000;

                    if (expirationTime - now < fiveMinutes) {
                        console.log('Token expiring soon, refreshing...');
                        await user.getIdToken(true); // true = force refresh
                    }
                } catch (error) {
                    console.error('Token refresh error:', error);
                }

                callback(user, true);
            } else {
                // User is signed out
                this.currentUser = null;
                this.clearUserCache();
                callback(null, false);
            }
        });
    }

    /**
     * Update localStorage with user data and timestamp
     */
    async updateUserCache(user) {
        const userData = {
            userName: user.displayName,
            userEmail: user.email,
            userPhoto: user.photoURL,
            userId: user.uid,
            sessionTimestamp: Date.now().toString()
        };

        localStorage.setItem('userName', userData.userName);
        localStorage.setItem('userEmail', userData.userEmail);
        localStorage.setItem('userPhoto', userData.userPhoto);
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('sessionTimestamp', userData.sessionTimestamp);

        // Store the last token refresh time
        localStorage.setItem('lastTokenRefresh', Date.now().toString());
    }

    /**
     * Check if user session is valid
     */
    isSessionValid() {
        const sessionTimestamp = localStorage.getItem('sessionTimestamp');
        const userId = localStorage.getItem('userId');

        if (!sessionTimestamp || !userId) {
            return false;
        }

        const now = Date.now();
        const sessionAge = now - parseInt(sessionTimestamp);

        return sessionAge < this.sessionDuration;
    }

    /**
     * Get current authenticated user
     * Returns Firebase user if authenticated, null otherwise
     */
    getCurrentUser() {
        return this.currentUser || this.auth?.currentUser || null;
    }

    /**
     * Wait for auth state to be determined
     * Useful for page load to check if user is already authenticated
     */
    async waitForAuthState() {
        if (!this.auth) {
            throw new Error('Auth not initialized');
        }

        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        if (!this.auth) {
            throw new Error('Auth not initialized');
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        try {
            const result = await signInWithPopup(this.auth, provider);
            await this.updateUserCache(result.user);
            return result.user;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        if (!this.auth) {
            throw new Error('Auth not initialized');
        }

        try {
            await this.auth.signOut();
            this.clearUserCache();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * Clear user cache from localStorage
     */
    clearUserCache() {
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPhoto');
        localStorage.removeItem('userId');
        localStorage.removeItem('sessionTimestamp');
        localStorage.removeItem('lastTokenRefresh');
    }

    /**
     * Get cached user data from localStorage
     */
    getCachedUserData() {
        return {
            userName: localStorage.getItem('userName'),
            userEmail: localStorage.getItem('userEmail'),
            userPhoto: localStorage.getItem('userPhoto'),
            userId: localStorage.getItem('userId'),
            sessionTimestamp: localStorage.getItem('sessionTimestamp')
        };
    }
}

// Export singleton instance
export const authService = new AuthService();
