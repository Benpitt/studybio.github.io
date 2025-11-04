/**
 * Authentication Guard with Firebase Token Validation
 * Protects pages by verifying both Firebase auth state and local session
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { authService } from './auth-service.js';
import { firebaseConfig } from './config.js';
import { debugLog, debugError } from './config.js';

(async function() {
    // Check if we're already on index (login page)
    const isLoginPage = window.location.pathname.includes('index') ||
                        window.location.pathname === '/' ||
                        window.location.pathname === '';

    // If we're on the login page, skip authentication check
    if (isLoginPage) {
        return;
    }

    // Initialize Firebase and auth service
    const app = initializeApp(firebaseConfig);
    await authService.initializeAuth(app);

    // Quick check of localStorage first (fast)
    const userName = localStorage.getItem('userName');
    const userId = localStorage.getItem('userId');
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');

    // If localStorage data is missing or expired, redirect immediately
    if (!userName || !userId || !sessionTimestamp || !authService.isSessionValid()) {
        debugLog('No valid local session, redirecting to login...');
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    // Now verify Firebase auth state (with cached token)
    try {
        const user = await authService.waitForAuthState();

        if (!user) {
            // No Firebase user, session is invalid
            debugLog('No Firebase user found, redirecting to login...');
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        // Verify the user ID matches
        if (user.uid !== userId) {
            debugLog('User ID mismatch, clearing session...');
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        // Set up auth state listener for automatic updates
        authService.onAuthStateChange((user, isAuthenticated) => {
            if (!isAuthenticated) {
                // User signed out or token expired
                debugLog('Auth state changed: user signed out');
                localStorage.clear();
                window.location.href = '/';
            } else {
                // User is authenticated, ensure cache is up to date
                debugLog('Auth state verified for:', user.displayName);
            }
        });

        debugLog('Valid session found for:', userName);

    } catch (error) {
        debugError('Auth verification error:', error);
        localStorage.clear();
        window.location.href = '/';
    }
})();
