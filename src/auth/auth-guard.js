/**
 * Authentication Guard with Firebase Token Validation
 * Protects pages by verifying both Firebase auth state and local session
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { authService } from './auth-service.js';

(async function() {
    // Check if we're already on index.html (login page)
    const isLoginPage = window.location.pathname.includes('index.html') ||
                        window.location.pathname === '/' ||
                        window.location.pathname === '';

    // If we're on the login page, skip authentication check
    if (isLoginPage) {
        return;
    }

    // Initialize Firebase and auth service
    const firebaseConfig = {
        apiKey: "AIzaSyD-2SELHboxELp2XLQIwstiI-pCaNcUDOA",
        authDomain: "academie-9942b.firebaseapp.com",
        projectId: "academie-9942b",
        storageBucket: "academie-9942b.firebasestorage.app",
        messagingSenderId: "1079518919325",
        appId: "1:1079518919325:web:745025bdb7b2b23645b274"
    };

    const app = initializeApp(firebaseConfig);
    await authService.initializeAuth(app);

    // Quick check of localStorage first (fast)
    const userName = localStorage.getItem('userName');
    const userId = localStorage.getItem('userId');
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');

    // If localStorage data is missing or expired, redirect immediately
    if (!userName || !userId || !sessionTimestamp || !authService.isSessionValid()) {
        console.log('No valid local session, redirecting to login...');
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    // Now verify Firebase auth state (with cached token)
    try {
        const user = await authService.waitForAuthState();

        if (!user) {
            // No Firebase user, session is invalid
            console.log('No Firebase user found, redirecting to login...');
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        // Verify the user ID matches
        if (user.uid !== userId) {
            console.log('User ID mismatch, clearing session...');
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        // Set up auth state listener for automatic updates
        authService.onAuthStateChange((user, isAuthenticated) => {
            if (!isAuthenticated) {
                // User signed out or token expired
                console.log('Auth state changed: user signed out');
                localStorage.clear();
                window.location.href = 'index.html';
            } else {
                // User is authenticated, ensure cache is up to date
                console.log('Auth state verified for:', user.displayName);
            }
        });

        console.log('Valid session found for:', userName);

    } catch (error) {
        console.error('Auth verification error:', error);
        localStorage.clear();
        window.location.href = 'index.html';
    }
})();
