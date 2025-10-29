/**
 * Configuration file for studying.works
 * Centralizes all configuration in one place
 */

// Firebase configuration
// NOTE: These API keys are safe to expose in client-side code
// They are not secret keys - Firebase security is handled by Firestore rules
export const firebaseConfig = {
    apiKey: "AIzaSyD-2SELHboxELp2XLQIwstiI-pCaNcUDOA",
    authDomain: "academie-9942b.firebaseapp.com",
    projectId: "academie-9942b",
    storageBucket: "academie-9942b.firebasestorage.app",
    messagingSenderId: "1079518919325",
    appId: "1:1079518919325:web:745025bdb7b2b23645b274"
};

// Application settings
export const appConfig = {
    sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    autoSyncInterval: 5, // minutes
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    // debugMode is automatically set based on environment
    get debugMode() {
        return !isProduction();
    }
};

// Feature flags
export const features = {
    enableAnalytics: false,
    enableOfflineMode: false,
    enableAutoSync: true,
    enableDynamicGradient: true
};

// API endpoints (for future use)
export const apiEndpoints = {
    // Add any external API endpoints here
};

// Helper to check if we're in production
export const isProduction = () => {
    return window.location.hostname === 'studying.works' || 
           window.location.hostname === 'www.studying.works';
};

// Helper to check if debugging is enabled
export const isDebugMode = () => {
    return appConfig.debugMode;
};

// Console wrapper that only logs in debug mode
export const debugLog = (...args) => {
    if (isDebugMode()) {
        console.log(...args);
    }
};

export const debugError = (...args) => {
    if (isDebugMode()) {
        console.error(...args);
    }
};

export const debugWarn = (...args) => {
    if (isDebugMode()) {
        console.warn(...args);
    }
};
